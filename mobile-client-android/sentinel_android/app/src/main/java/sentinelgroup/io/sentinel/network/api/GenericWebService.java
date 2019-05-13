package sentinelgroup.io.sentinel.network.api;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.Url;
import sentinelgroup.io.sentinel.network.model.Account;
import sentinelgroup.io.sentinel.network.model.Balance;
import sentinelgroup.io.sentinel.network.model.GasEstimateEntity;
import sentinelgroup.io.sentinel.network.model.GenericRequestBody;
import sentinelgroup.io.sentinel.network.model.GenericResponse;
import sentinelgroup.io.sentinel.network.model.PayResponse;
import sentinelgroup.io.sentinel.network.model.ReportPay;
import sentinelgroup.io.sentinel.network.model.Tokens;
import sentinelgroup.io.sentinel.network.model.TxHistory;
import sentinelgroup.io.sentinel.network.model.Vpn;
import sentinelgroup.io.sentinel.network.model.VpnConfig;
import sentinelgroup.io.sentinel.network.model.VpnCredentials;
import sentinelgroup.io.sentinel.network.model.VpnUsage;

/**
 * REST API access points for VPN and wallet flow
 */
public interface GenericWebService {
    @POST(EndPoint.CREATE_NEW_ACCOUNT)
    Call<Account> createNewAccount(@Body GenericRequestBody iBody);

    @POST(EndPoint.GET_ACCOUNT_BALANCE)
    Call<Balance> getAccountBalance(@Body GenericRequestBody iBody);

    @POST(EndPoint.GET_FREE_SENT)
    Call<Tokens> getFreeTokens(@Body GenericRequestBody iBody);

    @POST(EndPoint.RAW_TRANSACTION)
    Call<PayResponse> makeRawTransaction(@Body GenericRequestBody iBody);

    @GET(EndPoint.GET_UNOCCUPIED_VPN_SERVERS)
    Call<Vpn> getUnoccupiedVpnList();

    @POST(EndPoint.GET_VPN_SERVER_CREDENTIALS)
    Call<VpnCredentials> getVpnServerCredentials(@Body GenericRequestBody iBody);

    @POST(EndPoint.GET_VPN_USAGE_FOR_USER)
    Call<VpnUsage> getVpnUsageForUser(@Body GenericRequestBody iBody);

    @POST(EndPoint.GET_VPN_CURRENT_USAGE)
    Call<VpnUsage> getVpnCurrentUsage(@Body GenericRequestBody iBody);

    @POST(EndPoint.MAKE_VPN_USAGE_PAYMENT)
    Call<PayResponse> makeVpnUsagePayment(@Body GenericRequestBody iBody);

    @POST(EndPoint.REPORT_PAYMENT)
    Call<ReportPay> reportPayment(@Body GenericRequestBody iBody);

    @POST
    Call<VpnConfig> getVpnConfig(@Url String url, @Body GenericRequestBody iBody);

    @POST
    Call<GenericResponse> disconnectVpn(@Url String url, @Body GenericRequestBody iBody);

    @GET
    Call<GasEstimateEntity> getGasPriceEstimate(@Url String url);

    @POST
    Call<TxHistory> getTransactionHistory(@Url String url);

    @POST(EndPoint.POST_VPN_SESSION_RATING)
    Call<GenericResponse> rateVpnSession(@Body GenericRequestBody iBody);
}