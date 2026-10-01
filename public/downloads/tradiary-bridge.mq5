//+------------------------------------------------------------------+
//| tradiary-bridge.mq5                                              |
//| Tradiary MetaTrader 5 Bridge EA  v1.1                           |
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
#property version   "1.10"
#property strict

//--- Inputs
input string InpApiUrl   = "https://your-tradiary-domain.com/api/integrations/metatrader/webhook";
input string InpApiToken = "";

//--- Queue of JSON payloads waiting to be sent
string g_queue[];

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
   EventSetTimer(2); // drain queue every 2 seconds
   Print("Tradiary Bridge v1.1: started. Webhook URL: ", InpApiUrl);
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
   // Only care about completed deals being added to history
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
   }
   else
   {
      // Position already closed — best available source is the deal record
      sl = HistoryDealGetDouble(trans.deal, DEAL_SL);
      tp = HistoryDealGetDouble(trans.deal, DEAL_TP);
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
//| OnTimer — drain the send queue (runs every 2 s)                  |
//+------------------------------------------------------------------+
void OnTimer()
{
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
