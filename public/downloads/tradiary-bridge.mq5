//+------------------------------------------------------------------+
//| tradiary-bridge.mq5                                              |
//| Tradiary MetaTrader 5 Bridge EA                                  |
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
#property version   "1.00"
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
   Print("Tradiary Bridge: started. Webhook URL: ", InpApiUrl);
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

   long  entry     = HistoryDealGetInteger(trans.deal, DEAL_ENTRY);
   long  dealType  = HistoryDealGetInteger(trans.deal, DEAL_TYPE);
   string symbol   = HistoryDealGetString(trans.deal,  DEAL_SYMBOL);
   double price    = HistoryDealGetDouble(trans.deal,  DEAL_PRICE);
   double lots     = HistoryDealGetDouble(trans.deal,  DEAL_VOLUME);
   double sl       = HistoryDealGetDouble(trans.deal,  DEAL_SL);
   double tp       = HistoryDealGetDouble(trans.deal,  DEAL_TP);
   double commission = HistoryDealGetDouble(trans.deal, DEAL_COMMISSION);
   double swap     = HistoryDealGetDouble(trans.deal,  DEAL_SWAP);
   double profit   = HistoryDealGetDouble(trans.deal,  DEAL_PROFIT);
   long  ticket    = HistoryDealGetInteger(trans.deal, DEAL_TICKET);
   long  posTicket = HistoryDealGetInteger(trans.deal, DEAL_POSITION_ID);
   datetime dealTime = (datetime)HistoryDealGetInteger(trans.deal, DEAL_TIME);

   // Determine direction: DEAL_TYPE_BUY=0, DEAL_TYPE_SELL=1
   string typStr = (dealType == DEAL_TYPE_BUY) ? "buy" : "sell";

   // Determine event: DEAL_ENTRY_IN=0 (open), DEAL_ENTRY_OUT=1 (close)
   string eventStr = "";
   if(entry == DEAL_ENTRY_IN)
      eventStr = "trade_open";
   else if(entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_INOUT)
      eventStr = "trade_close";
   else
      return; // DEAL_ENTRY_OUT_BY etc. — ignore

   // Use the position ticket as externalId so open/close match up
   string ticketStr = IntegerToString(posTicket);

   string json = BuildJson(eventStr, ticketStr, symbol, typStr, lots, price,
                            sl, tp, commission, swap, profit, dealTime,
                            price, dealTime, entry, profit);
   if(json == "") return;

   // Enqueue
   int n = ArraySize(g_queue);
   ArrayResize(g_queue, n + 1);
   g_queue[n] = json;
}

//+------------------------------------------------------------------+
//| OnTimer — drain the send queue                                   |
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
                 double price,
                 double sl,
                 double tp,
                 double commission,
                 double swap,
                 double profit,
                 datetime openTime,
                 double closePrice,
                 datetime closeTime,
                 long   entry,
                 double finalProfit)
{
   string timeStr      = TimeToString(openTime,  TIME_DATE | TIME_SECONDS);
   string closeTimeStr = TimeToString(closeTime, TIME_DATE | TIME_SECONDS);

   // Convert MT5 time string "YYYY.MM.DD HH:MM:SS" to ISO 8601
   StringReplace(timeStr,      ".", "-");
   StringReplace(closeTimeStr, ".", "-");
   // MT5 uses spaces, ISO 8601 needs T
   StringReplace(timeStr,      " ", "T");
   StringReplace(closeTimeStr, " ", "T");
   timeStr      += "Z";
   closeTimeStr += "Z";

   string json = "{";
   json += "\"event\":\"" + eventStr + "\",";
   json += "\"ticket\":\"" + ticket + "\",";
   json += "\"symbol\":\"" + symbol + "\",";
   json += "\"type\":\"" + tradeType + "\",";
   json += "\"lots\":" + DoubleToString(lots, 2) + ",";
   json += "\"price\":" + DoubleToString(price, _Digits) + ",";
   json += "\"sl\":" + (sl > 0 ? DoubleToString(sl, _Digits) : "null") + ",";
   json += "\"tp\":" + (tp > 0 ? DoubleToString(tp, _Digits) : "null") + ",";
   json += "\"time\":\"" + timeStr + "\",";
   json += "\"commission\":" + DoubleToString(commission, 2) + ",";
   json += "\"swap\":" + DoubleToString(swap, 2) + ",";
   json += "\"profit\":" + DoubleToString(profit, 2);

   if(entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_INOUT)
   {
      json += ",\"close_price\":" + DoubleToString(closePrice, _Digits);
      json += ",\"close_time\":\"" + closeTimeStr + "\"";
   }

   json += "}";
   return json;
}

//+------------------------------------------------------------------+
//| SendToTradiary — POST the JSON payload, return true on 200       |
//+------------------------------------------------------------------+
bool SendToTradiary(string json)
{
   string headers = "Content-Type: application/json\r\nX-Tradiary-Token: " + InpApiToken + "\r\n";
   char   post[];
   char   resultBytes[];
   string resultHeaders;

   // StringToCharArray excludes the null terminator when we specify exact length
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
      Print("Tradiary Bridge: 401 Unauthorized — check your InpApiToken or regenerate it in Tradiary settings.");
   else if(status == -1)
      Print("Tradiary Bridge: Network error — check that the URL is allow-listed in Tools → Options → Expert Advisors.");

   return false;
}
