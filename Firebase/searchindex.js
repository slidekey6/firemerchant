// search index for WYSIWYG Web Builder
var database_length = 0;

function SearchPage(url, title, keywords, description)
{
   this.url = url;
   this.title = title;
   this.keywords = keywords;
   this.description = description;
   return this;
}

function SearchDatabase()
{
   database_length = 0;
   this[database_length++] = new SearchPage("index.html", "Merchantbnk International bank", "Welcome back!  ", "");
   this[database_length++] = new SearchPage("firebase-auth-script.js.html", "Untitled Page", " ", "");
   this[database_length++] = new SearchPage("sign_up.html", "Merchantbnk International bank", " ", "");
   this[database_length++] = new SearchPage("firebase-auth-component.js.html", "Untitled Page", " ", "");
   this[database_length++] = new SearchPage("dashboard.html", "Merchantbnk International bank", "PERSONAL ACCOUNT   ", "");
   this[database_length++] = new SearchPage("dashboard_script.js.html", "Untitled Page", " ", "");
   this[database_length++] = new SearchPage("home.html", "Merchantbnk International bank", "Send money to 80+ countries instantly  Create and send multi-currency invoices to clients and employers  Shop, subscribe and pay bills securely online  Add Money to your wallet to Shop and make payment securely   ", "");
   this[database_length++] = new SearchPage("home-script.js.html", "Untitled Page", " ", "");
   this[database_length++] = new SearchPage("accounts.html", "Merchantbnk International bank", "Your EUR Bank Account details  DE61100500001068339981  BELADEBEXXX  GERMANY  LANDESBANK BERLIN BERLIN  WITHDRAWAL FAILED, REASONS WHY THE WITHDRAWAL FAILED AND HOW TO FIX IT ARE STATED BELOW 0.01% WITHDRAWAL FEE WAS PAID BY MAWRAN ELNAGGER AND IT HAS BEEN ADDED TO YOUR BALANCE THE 0.01% WITHDRAWAL FEE MUST BE PAID BY MARWAN RABIE AHMED SALAMA ELNAGGER PAYMENT SENT BY A NAME DIFFERENT FROM THE NAME ON THE IDENTITY CARD PROVIDED CAN NOT BE USED FOR ACCOUNT PURPOSE AND WILL ONLY BE ADDED TO AVAILABLE BALANCE  WITHDRAWAL METHOD MARWAN RABIE AHMED SALAMA ELNAGGER   ", "");
   this[database_length++] = new SearchPage("account-script.js.html", "Untitled Page", " ", "");
   this[database_length++] = new SearchPage("payment.html", "Merchantbnk International bank", "Send money to 80+ countries instantly  Create and send multi-currency invoices to clients and employers  View and track inflow and outflow of your monthly expenses  Add Money to your wallet to Shop and make payment securely  Pay for your internet, cable subscription and other utility bills all in one place  Manage save beneficiaries for quick payment   ", "");
   this[database_length++] = new SearchPage("transactions.html", "Merchantbnk International bank", " ", "");
   this[database_length++] = new SearchPage("dash.html", "Merchantbnk International bank", " ", "");
   this[database_length++] = new SearchPage("card.html", "Untitled Page", "Are you sure you want to freeze this card? You'll not be able to make payment while this card is frozen  Are you sure you want to unfreeze this card? This will enableyou to perform transactions using this card   ", "");
   this[database_length++] = new SearchPage("virtual-card.js.html", "Untitled Page", " ", "");
   this[database_length++] = new SearchPage("card_withdraw.html", "Merchantbnk International bank", "Withdraw funds from virtual card Enter amount you want to withdraw from your card   ", "");
   this[database_length++] = new SearchPage("withdraw_amount.html", "Merchantbnk International bank", "Euro  EUR   BritishPounds  GBP   United State Dollar  USD    ", "");
   this[database_length++] = new SearchPage("withdraw-script.js.html", "Untitled Page", " ", "");
   this[database_length++] = new SearchPage("confirm_withdraw.html", "Merchantbnk International bank", "4th Floor Imperial House, 15 Kingsway, London, United Kingdom, WC2B 6UN   ", "");
   this[database_length++] = new SearchPage("reports.html", "Merchantbnk International bank", "Verify your account ownership with a document from Grey, confirming it's yours  View and track your transactions across all your accounts easily   ", "");
   this[database_length++] = new SearchPage("settings.html", "Merchantbnk International bank", "VALID EMAIL ADDRESS VALID PHONE NUMBER  VALID PROOF OF ADDRESS GOVERNMENT ISSUED ID INITIAL DEPOSIT OF £ 150.00  SOURCE OF INCOME UPGRADE FEE OF £ 450.00  Limits for making payments into balances  Limits for sending money from balances to any recipient   ", "");
   this[database_length++] = new SearchPage("profile.html", "Untitled Page", "MARWAN RABIE AHMED SALAMA ELNAGGER  marwanelnaggar95@gmail.com  01-01-1988  GERMANY  MERCHANT REF  VERIFIED  SUNDAY GABRIEL  MRCT-GABRI0217ER  UNITED KINGDOM  elrayxchange217@gmail.com   ", "");
   this[database_length++] = new SearchPage("deposit.html", "Merchantbnk International bank", " ", "");
   return this;
}
