//+------------------------------------------------------------------+
//| tradiary-bridge.mq5                                              |
//| Tradiary MetaTrader 5 Bridge EA  v1.5                           |
//|                                                                  |
//| Automatically pushes trade open/close events to your Tradiary    |
//| journal via WebRequest.                                          |
//|                                                                  |
//| SETUP REQUIRED — the EA will silently fail (error 4060) unless   |
//| you complete these steps:                                        |
//|  1. Attach this EA to ANY one chart (it monitors all deals).     |
//|  2. In MT5 go to: Tools → Options → Expert Advisors              |
//|  3. Check "Allow WebRequest for listed URL"                      |
//|  4. Add your Tradiary webhook URL to the list, e.g.:             |
//|       https://your-tradiary-domain.com/api/integrations/metatrader/webhook
//|  5. Set the InpApiToken input to the token you generated in      |
//|     Tradiary → Settings → Integrations.                          |
//+------------------------------------------------------------------+
#property copyright "Tradiary"
#property link      "https://tradairy.vercel.app/"
#property version   "1.50"
#property strict

//--- Inputs
input string InpApiUrl   = "https://your-tradiary-domain.com/api/integrations/metatrader/webhook";
input string InpApiToken = "";

//--- Queue of JSON payloads waiting to be sent
string g_queue[];

//--- Per-position SL/TP tracking (parallel arrays, keyed by position ticket)
//    Used to detect SL/TP changes made AFTER instant-order execution.
long   g_trackedTickets[];
double g_trackedSL[];
double g_trackedTP[];

//--- How many days back to scan for missed closed deals on restart
input int InpHistorySyncDays = 7;

//--- Seconds to wait after EA startup before running the history sync.
//    MT5 re-connects to the broker asynchronously after launch; if we call
//    HistorySelect() too early (inside OnInit) the deal cache is still empty
//    and no missed deals are found.  Default 20 s covers most broker latencies.
//    Increase to 30–60 if your broker's server is slow or you are on a VPS.
input int InpHistorySyncDelaySec = 20;

//--- Runtime state — history sync
bool g_syncDone          = false;  // set to true once sync has run
int  g_startupTicksLeft  = 0;      // counts down in OnTimer before sync fires

//+------------------------------------------------------------------+
//| OnInit                                                           |
//+------------------------------------------------------------------+
int OnInit()
{
   if(InpApiToken == "")
   {
      Print("Tradiary Bridge: InpApiToken is empty. Please set your API token in the EA inputs.");
      return(INIT_FAILED);
   }

   // Timer fires every 2 seconds — used both for queue draining and the
   // deferred history sync.  2 ticks = 4 s, so the countdown below in
   // OnTimer() converts InpHistorySyncDelaySec into a tick count correctly.
   EventSetTimer(2);

   // Compute how many 2-second ticks to wait before running the history sync.
   // We do NOT call SyncMissedClosedDeals() here because MT5 re-connects to
   // the broker server asynchronously after startup; HistorySelect() called
   // immediately inside OnInit() sees an empty or partial deal cache and finds
   // nothing to replay.  The countdown defers the call until history is ready.
   g_syncDone         = false;
   g_startupTicksLeft = MathMax(1, (int)MathCeil((double)InpHistorySyncDelaySec / 2.0));

   Print("Tradiary Bridge v1.5: started. Webhook URL: ", InpApiUrl);
   Print("Tradiary Bridge: history sync scheduled in ~", InpHistorySyncDelaySec, " s (",
         g_startupTicksLeft, " timer ticks).");

   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| OnDeinit                                                         |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   Print("Tradiary Bridge: stopped.");
}

//+------------------------------------------------------------------+
//| OnTradeTransaction — fires on every deal/order change            |
//| MUST NOT block on network — payload is queued, sent by OnTimer.  |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction &trans,
                         const MqlTradeRequest    &request,
                         const MqlTradeResult     &result)
{
   // ── Handle position modifications (SL/TP changes on instant orders) ────
   if(trans.type == TRADE_TRANSACTION_POSITION)
   {
      long   posTicket = trans.position;
      if(posTicket <= 0) return;
      if(!PositionSelectByTicket(posTicket)) return;

      double newSL = PositionGetDouble(POSITION_SL);
      double newTP = PositionGetDouble(POSITION_TP);

      // Find this ticket in our tracking arrays
      int idx = -1;
      int trackedCount = ArraySize(g_trackedTickets);
      for(int i = 0; i < trackedCount; i++)
      {
         if(g_trackedTickets[i] == posTicket) { idx = i; break; }
      }

      if(idx == -1) return; // not a position we opened this session — ignore

      // Only emit if SL or TP actually changed
      bool slChanged = (MathAbs(newSL - g_trackedSL[idx]) > 1e-9);
      bool tpChanged = (MathAbs(newTP - g_trackedTP[idx]) > 1e-9);
      if(!slChanged && !tpChanged) return;

      // Update cached values
      g_trackedSL[idx] = newSL;
      g_trackedTP[idx] = newTP;

      string symbol    = PositionGetString(POSITION_SYMBOL);
      string ticketStr = IntegerToString(posTicket);
      datetime now     = TimeCurrent();

      string json = BuildModifyJson(ticketStr, newSL, newTP, symbol, now);
      if(json == "") return;

      int n = ArraySize(g_queue);
      ArrayResize(g_queue, n + 1);
      g_queue[n] = json;
      return;
   }

   // ── Only care about completed deals being added to history ───────────────
   if(trans.type != TRADE_TRANSACTION_DEAL_ADD) return;

   // Fetch full deal details from history
   if(!HistoryDealSelect(trans.deal)) return;

   long   entry      = HistoryDealGetInteger(trans.deal, DEAL_ENTRY);
   long   dealType   = HistoryDealGetInteger(trans.deal, DEAL_TYPE);
   string symbol     = HistoryDealGetString(trans.deal,  DEAL_SYMBOL);
   double dealPrice  = HistoryDealGetDouble(trans.deal,  DEAL_PRICE);
   double lots       = HistoryDealGetDouble(trans.deal,  DEAL_VOLUME);
   double commission = HistoryDealGetDouble(trans.deal,  DEAL_COMMISSION);
   double swap       = HistoryDealGetDouble(trans.deal,  DEAL_SWAP);
   double profit     = HistoryDealGetDouble(trans.deal,  DEAL_PROFIT);
   long   posTicket  = HistoryDealGetInteger(trans.deal, DEAL_POSITION_ID);
   datetime dealTime = (datetime)HistoryDealGetInteger(trans.deal, DEAL_TIME);

   // Determine direction
   string typStr = (dealType == DEAL_TYPE_BUY) ? "buy" : "sell";

   // Determine event type
   string eventStr = "";
   if(entry == DEAL_ENTRY_IN)
      eventStr = "trade_open";
   else if(entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_INOUT)
      eventStr = "trade_close";
   else
      return; // DEAL_ENTRY_OUT_BY etc. — ignore

   // ── Contract size — multiply here so the backend stores real units ──────
   // e.g. Gold (XAUUSD): 1 lot = 100 oz, so lots=0.01 → quantity=1 oz
   double contractSize = SymbolInfoDouble(symbol, SYMBOL_TRADE_CONTRACT_SIZE);
   if(contractSize <= 0) contractSize = 1.0; // fallback — should never happen
   double quantity = lots * contractSize;

   // ── SL / TP ─────────────────────────────────────────────────────────────
   // DEAL_SL / DEAL_TP on a deal record are almost always 0 in MT5.
   // For an open deal: read from the live position while it still exists.
   // For a close deal: read from the deal's own SL/TP fields (set by the
   //   broker at execution) or fall back to 0 (will show as — in Tradiary).
   double sl = 0.0;
   double tp = 0.0;

   if(entry == DEAL_ENTRY_IN)
   {
      // Position is live — select it and read SL/TP directly
      if(PositionSelectByTicket(posTicket))
      {
         sl = PositionGetDouble(POSITION_SL);
         tp = PositionGetDouble(POSITION_TP);
      }

      // ── Begin tracking SL/TP for this position so we can detect ──────────
      // later modifications (e.g. trader adds SL/TP after instant order fill)
      int n = ArraySize(g_trackedTickets);
      ArrayResize(g_trackedTickets, n + 1);
      ArrayResize(g_trackedSL,      n + 1);
      ArrayResize(g_trackedTP,      n + 1);
      g_trackedTickets[n] = posTicket;
      g_trackedSL[n]      = sl;
      g_trackedTP[n]      = tp;
   }
   else
   {
      // Position already closed — best available source is the deal record
      sl = HistoryDealGetDouble(trans.deal, DEAL_SL);
      tp = HistoryDealGetDouble(trans.deal, DEAL_TP);

      // ── Remove from tracking once position is closed ──────────────────────
      int trackedCount = ArraySize(g_trackedTickets);
      for(int i = 0; i < trackedCount; i++)
      {
         if(g_trackedTickets[i] == posTicket)
         {
            ArrayRemove(g_trackedTickets, i, 1);
            ArrayRemove(g_trackedSL,      i, 1);
            ArrayRemove(g_trackedTP,      i, 1);
            break;
         }
      }
   }

   // ── Fees: commission + swap ──────────────────────────────────────────────
   // commission: charged on entry deal (usually negative, e.g. -3.50)
   // swap:       charged on overnight holding, non-zero only on close deal
   // Both are summed on the backend; we send each separately.
   // Note: abs() not needed — backend uses Math.abs() to handle negative values.

   // Use position ticket as externalId so open and close events match
   string ticketStr = IntegerToString(posTicket);

   string json = BuildJson(eventStr, ticketStr, symbol, typStr,
                            lots, quantity, dealPrice,
                            sl, tp, commission, swap, profit, dealTime,
                            dealPrice, dealTime, entry);
   if(json == "") return;

   // Enqueue — never block OnTradeTransaction with network I/O
   int n = ArraySize(g_queue);
   ArrayResize(g_queue, n + 1);
   g_queue[n] = json;
}

//+------------------------------------------------------------------+
//| SyncMissedClosedDeals — called once from OnTimer after startup   |
//| delay elapses (NOT from OnInit — history not ready that early).  |
//| Scans broker history for the past InpHistorySyncDays days and     |
//| replays any trade_close events that Tradiary may have missed while |
//| the EA was not running. The server handles duplicates gracefully  |
//| via the externalId sparse-unique index (idempotent upsert).       |
//+------------------------------------------------------------------+
void SyncMissedClosedDeals()
{
   datetime lookbackFrom = TimeCurrent() - (datetime)(InpHistorySyncDays * 24 * 3600);
   datetime lookbackTo   = TimeCurrent();

   if(!HistorySelect(lookbackFrom, lookbackTo))
   {
      Print("Tradiary Bridge: HistorySelect failed — cannot sync missed deals.");
      return;
   }

   int total   = HistoryDealsTotal();
   int enqueued = 0;

   for(int i = 0; i < total; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) continue;

      // Only replay closing deals
      long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      if(entry != DEAL_ENTRY_OUT && entry != DEAL_ENTRY_INOUT) continue;

      long   dealType   = HistoryDealGetInteger(ticket, DEAL_TYPE);
      string symbol     = HistoryDealGetString(ticket,  DEAL_SYMBOL);
      double dealPrice  = HistoryDealGetDouble(ticket,  DEAL_PRICE);   // close price for OUT deals
      double closePrice = dealPrice;                                     // close == same deal price for OUT deals
      double lots       = HistoryDealGetDouble(ticket,  DEAL_VOLUME);
      double commission = HistoryDealGetDouble(ticket,  DEAL_COMMISSION);
      double swap       = HistoryDealGetDouble(ticket,  DEAL_SWAP);
      double profit     = HistoryDealGetDouble(ticket,  DEAL_PROFIT);
      long   posTicket  = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
      datetime dealTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);

      // Recover entry (open) price and TRUE direction from the matching DEAL_ENTRY_IN deal.
      // IMPORTANT: In MT5 the closing deal type is always the OPPOSITE of the actual trade
      // direction (e.g. a Buy/Long trade is closed by a DEAL_TYPE_SELL deal).  We must
      // read the direction from the opening deal, not the closing deal, to log it correctly.
      double entryPrice = 0.0;
      datetime entryTime = 0;
      double sl = HistoryDealGetDouble(ticket, DEAL_SL);
      double tp = HistoryDealGetDouble(ticket, DEAL_TP);
      long   entryDealType = dealType; // fallback — overwritten below when opening deal is found

      // Scan history for the corresponding opening deal of this position
      for(int j = 0; j < total; j++)
      {
         ulong t2 = HistoryDealGetTicket(j);
         if(t2 == 0) continue;
         if(HistoryDealGetInteger(t2, DEAL_POSITION_ID) != posTicket) continue;
         if(HistoryDealGetInteger(t2, DEAL_ENTRY) != DEAL_ENTRY_IN)   continue;
         entryPrice    = HistoryDealGetDouble(t2,  DEAL_PRICE);
         entryTime     = (datetime)HistoryDealGetInteger(t2, DEAL_TIME);
         entryDealType = HistoryDealGetInteger(t2,  DEAL_TYPE); // BUY on a Long, SELL on a Short
         break;
      }
      if(entryPrice <= 0.0) entryPrice = dealPrice; // fallback
      if(entryTime  == 0)   entryTime  = dealTime;

      // Use the OPENING deal type for direction — it matches the actual trade direction.
      string typStr    = (entryDealType == DEAL_TYPE_BUY) ? "buy" : "sell";
      string ticketStr = IntegerToString(posTicket);

      double contractSize = SymbolInfoDouble(symbol, SYMBOL_TRADE_CONTRACT_SIZE);
      if(contractSize <= 0) contractSize = 1.0;
      double quantity = lots * contractSize;

      // Build the trade_close payload, tagged as a history sync
      string json = BuildJson("trade_close", ticketStr, symbol, typStr,
                              lots, quantity, entryPrice,
                              sl, tp, commission, swap, profit,
                              entryTime, closePrice, dealTime, entry);
      // Mark it as a history-sync replay so the server can log/audit it
      StringReplace(json, "}" , ",\"is_history_sync\":true}");

      if(json == "") continue;

      int n = ArraySize(g_queue);
      ArrayResize(g_queue, n + 1);
      g_queue[n] = json;
      enqueued++;
   }

   if(enqueued > 0)
      Print("Tradiary Bridge: queued ", enqueued, " missed close event(s) for history sync.");
   else
      Print("Tradiary Bridge: history sync complete — no missed close events found.");
}

//+------------------------------------------------------------------+
//| OnTimer — runs every 2 s: deferred history sync + queue drain    |
//+------------------------------------------------------------------+
void OnTimer()
{
   // ── Deferred history sync ──────────────────────────────────────────────
   // We cannot call SyncMissedClosedDeals() from OnInit() because MT5 loads
   // deal history from the broker server asynchronously after startup.
   // Calling HistorySelect() too early returns an empty cache, so no missed
   // deals would be found on the very first launch.
   //
   // Instead we count down timer ticks here and fire the sync once the
   // startup delay has elapsed — by which point the terminal has had time to
   // fully re-sync with the broker's deal history.
   if(!g_syncDone)
   {
      if(g_startupTicksLeft > 0)
      {
         g_startupTicksLeft--;
         // Optional progress log (uncomment for debugging):
         // Print("Tradiary Bridge: history sync in ", g_startupTicksLeft * 2, " s...");
      }
      else
      {
         // Countdown reached zero — broker history should now be available.
         g_syncDone = true;
         Print("Tradiary Bridge: startup delay elapsed, running history sync now.");
         SyncMissedClosedDeals();
      }
   }

   // ── Drain outbound queue ──────────────────────────────────────────────────
   while(ArraySize(g_queue) > 0)
   {
      string payload = g_queue[0];
      if(!SendToTradiary(payload)) break; // retry on next tick if it fails
      ArrayRemove(g_queue, 0, 1);
   }
}

//+------------------------------------------------------------------+
//| BuildJson — construct the webhook payload                        |
//+------------------------------------------------------------------+
string BuildJson(string eventStr,
                 string ticket,
                 string symbol,
                 string tradeType,
                 double lots,
                 double quantity,
                 double price,
                 double sl,
                 double tp,
                 double commission,
                 double swap,
                 double profit,
                 datetime openTime,
                 double closePrice,
                 datetime closeTime,
                 long   entry)
{
   string timeStr      = TimeToString(openTime,  TIME_DATE | TIME_SECONDS);
   string closeTimeStr = TimeToString(closeTime, TIME_DATE | TIME_SECONDS);

   // Convert MT5 time format "YYYY.MM.DD HH:MM:SS" → ISO 8601
   StringReplace(timeStr,      ".", "-");
   StringReplace(closeTimeStr, ".", "-");
   StringReplace(timeStr,      " ", "T");
   StringReplace(closeTimeStr, " ", "T");
   timeStr      += "Z";
   closeTimeStr += "Z";

   // Symbol digits — use for price/SL/TP precision
   int dig = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);
   if(dig <= 0) dig = _Digits;

   string json = "{";
   json += "\"event\":\""    + eventStr   + "\",";
   json += "\"ticket\":\""   + ticket     + "\",";
   json += "\"symbol\":\""   + symbol     + "\",";
   json += "\"type\":\""     + tradeType  + "\",";
   json += "\"lots\":"       + DoubleToString(lots, 2)      + ",";
   json += "\"quantity\":"   + DoubleToString(quantity, 4)  + ",";
   json += "\"price\":"      + DoubleToString(price, dig)   + ",";
   json += "\"sl\":"         + (sl > 0 ? DoubleToString(sl, dig) : "null") + ",";
   json += "\"tp\":"         + (tp > 0 ? DoubleToString(tp, dig) : "null") + ",";
   json += "\"time\":\""     + timeStr    + "\",";
   json += "\"commission\":" + DoubleToString(commission, 2) + ",";
   json += "\"swap\":"       + DoubleToString(swap, 2)       + ",";
   json += "\"profit\":"     + DoubleToString(profit, 2);

   if(entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_INOUT)
   {
      json += ",\"close_price\":" + DoubleToString(closePrice, dig);
      json += ",\"close_time\":\"" + closeTimeStr + "\"";
   }

   json += "}";
   return json;
}

//+------------------------------------------------------------------+
//| BuildModifyJson — lightweight payload for SL/TP modifications    |
//+------------------------------------------------------------------+
string BuildModifyJson(string ticket,
                       double sl,
                       double tp,
                       string symbol,
                       datetime modTime)
{
   string timeStr = TimeToString(modTime, TIME_DATE | TIME_SECONDS);
   StringReplace(timeStr, ".", "-");
   StringReplace(timeStr, " ", "T");
   timeStr += "Z";

   int dig = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);
   if(dig <= 0) dig = _Digits;

   string json = "{";
   json += "\"event\":\"trade_modify\",";
   json += "\"ticket\":\"" + ticket + "\",";
   json += "\"symbol\":\"" + symbol + "\",";
   json += "\"sl\":"  + (sl > 0 ? DoubleToString(sl, dig) : "null") + ",";
   json += "\"tp\":"  + (tp > 0 ? DoubleToString(tp, dig) : "null") + ",";
   json += "\"time\":\"" + timeStr + "\"";
   json += "}";
   return json;
}

//+------------------------------------------------------------------+
//| SendToTradiary — POST the JSON payload, return true on HTTP 200  |
//+------------------------------------------------------------------+
bool SendToTradiary(string json)
{
   string headers = "Content-Type: application/json\r\nX-Tradiary-Token: " + InpApiToken + "\r\n";
   char   post[];
   char   resultBytes[];
   string resultHeaders;

   int jsonLen = StringLen(json);
   ArrayResize(post, jsonLen);
   StringToCharArray(json, post, 0, jsonLen);

   int status = WebRequest("POST", InpApiUrl, headers, 5000, post, resultBytes, resultHeaders);

   if(status == 200)
      return true;

   string resultStr = CharArrayToString(resultBytes);
   Print("Tradiary Bridge: WebRequest failed. Status=", status,
         " Response: ", resultStr);

   if(status == 401)
      Print("Tradiary Bridge: 401 Unauthorized — check your InpApiToken or regenerate it in Tradiary Settings → Integrations.");
   else if(status == -1)
      Print("Tradiary Bridge: Network error — is the URL allow-listed in Tools → Options → Expert Advisors?");

   return false;
}
