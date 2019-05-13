package sentinelgroup.io.sentinel.viewmodel;

import android.arch.lifecycle.ViewModel;

import sentinelgroup.io.sentinel.network.model.GenericRequestBody;
import sentinelgroup.io.sentinel.network.model.VpnUsage;
import sentinelgroup.io.sentinel.repository.VpnRepository;
import sentinelgroup.io.sentinel.util.AppConstants;
import sentinelgroup.io.sentinel.util.AppPreferences;
import sentinelgroup.io.sentinel.util.Resource;
import sentinelgroup.io.sentinel.util.SingleLiveEvent;

public class VpnSelectViewModel extends ViewModel {
    private final VpnRepository mRepository;
    private final SingleLiveEvent<Resource<VpnUsage>> mVpnUsageLiveEvent;
    private final SingleLiveEvent<Boolean> mTokenAlertLiveEvent;

    VpnSelectViewModel(VpnRepository iRepository) {
        mRepository = iRepository;
        mVpnUsageLiveEvent = iRepository.getVpnUsageLiveEvent();
        mTokenAlertLiveEvent = iRepository.getTokenAlertLiveEvent(getRequestBody());
    }

    private GenericRequestBody getRequestBody() {
        String aAccountAddress = AppPreferences.getInstance().getString(AppConstants.PREFS_ACCOUNT_ADDRESS);
        return new GenericRequestBody.GenericRequestBodyBuilder().accountAddress(aAccountAddress).build();
    }

    public SingleLiveEvent<Resource<VpnUsage>> getVpnUsageLiveEvent() {
        mRepository.getVpnUsageForUser(getRequestBody());
        return mVpnUsageLiveEvent;
    }

    public SingleLiveEvent<Boolean> getTokenAlertLiveEvent() {
        return mTokenAlertLiveEvent;
    }
}