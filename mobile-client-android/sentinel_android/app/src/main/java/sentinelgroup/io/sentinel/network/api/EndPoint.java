package sentinelgroup.io.sentinel.network.api;

/**
 * Contains all the API endpoints used in the app.
 */
public class EndPoint {
    /*
     * VPN and Wallet flow
     */
    public static final String CREATE_NEW_ACCOUNT = "client/account";
    public static final String GET_ACCOUNT_BALANCE = "client/account/balance";
    public static final String GET_FREE_SENT = "dev/free";
    public static final String RAW_TRANSACTION = "client/raw-transaction";
    public static final String GET_UNOCCUPIED_VPN_SERVERS = "client/vpn/list";
    public static final String GET_VPN_SERVER_CREDENTIALS = "client/vpn";
    public static final String GET_VPN_USAGE_FOR_USER = "client/vpn/usage";
    public static final String GET_VPN_CURRENT_USAGE = "client/vpn/current";
    public static final String MAKE_VPN_USAGE_PAYMENT = "client/vpn/pay";
    public static final String REPORT_PAYMENT = "client/vpn/report";
    public static final String POST_VPN_SESSION_RATING = "client/vpn/rate";
    /*
     * Bonuses flow
     */
    public static final String ADD_ACCOUNT = "accounts";
    public static final String UPDATE_ACCOUNT = "accounts/{deviceId}";
    public static final String GET_ACCOUNT_INFO = "accounts/{type}/{value}";
    public static final String GET_BONUS_INFO = "accounts/{deviceId}/bonuses/info";
    public static final String CLAIM_BONUS = "bonus/claim";
    /*
     * App details Flow
     */
    public static final String GET_LATEST_VERSION_SNC = "version/latest?appCode=SNC";

}