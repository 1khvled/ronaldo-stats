/* Centralized Revenue & CPA Registry — RonaldoStats Monetization Config
   Single source of truth for all ad network IDs, affiliate tags, and
   high-CPA offer URLs. Swap any URL to an Impact.com tracking link in
   one line without touching app.js.
   -----------------------------------------------------------------------
   Override streamPassUrl at runtime by setting window.__RS_STREAM_CPA_URL
   before this module is imported.                                        */

export const MONETIZE_CONFIG = {
  /* Google AdSense publisher ID */
  adsenseClient: "ca-pub-8397501846754760",

  /* Adsterra primary Smartlink — also used as fallback for all CPA CTAs */
  adsterraSmartlinkUrl: "https://araplhn.org/4/9c0421236e838b103398fe1f230fd98e",

  /* Adsterra Social Bar external script URL.
     If non-empty, app.js mounts <iframe src="/ads/social-bar.html?src=..." ...>
     automatically; leave empty to use the built-in in-page push instead. */
  adsterraSocialBarScriptUrl: "",

  /* Amazon Associates tag */
  amazonAffiliateTag: "ronaldostats-20",

  /* High-CPA offer URLs — ready for 1-line Impact.com deep-link swaps */
  offers: {
    /** Live match stream pass — override at runtime with
     *  window.__RS_STREAM_CPA_URL before the module loads.            */
    get streamPassUrl() {
      return (typeof window !== "undefined" && window.__RS_STREAM_CPA_URL) ||
        "https://araplhn.org/4/9c0421236e838b103398fe1f230fd98e";
    },

    /** VPN streaming offer for geo-blocked matches */
    vpnStreamUrl: "https://araplhn.org/4/9c0421236e838b103398fe1f230fd98e",

    /** Real Madrid #7 jersey (Amazon affiliate) */
    kitMadridUrl:
      "https://www.amazon.com/s?k=real+madrid+ronaldo+7+jersey&tag=ronaldostats-20",

    /** Portugal #7 jersey (Amazon affiliate) */
    kitPortugalUrl:
      "https://www.amazon.com/s?k=portugal+ronaldo+jersey+7&tag=ronaldostats-20",

    /** Al Nassr #7 jersey (Amazon affiliate) */
    kitAlNassrUrl:
      "https://www.amazon.com/s?k=al+nassr+ronaldo+jersey&tag=ronaldostats-20",

    /** CR7 Mercurial boots (Amazon affiliate) */
    kitBootsUrl:
      "https://www.amazon.com/s?k=cristiano+ronaldo+mercurial+cr7+boots&tag=ronaldostats-20"
  }
};
