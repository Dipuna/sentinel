package sentinelgroup.io.sentinel.ui.fragment;


import android.annotation.SuppressLint;
import android.arch.lifecycle.ViewModelProviders;
import android.content.Context;
import android.content.Intent;
import android.graphics.Typeface;
import android.os.Bundle;
import android.provider.Settings;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.support.v4.content.ContextCompat;
import android.support.v7.widget.AppCompatImageButton;
import android.text.SpannableString;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import sentinelgroup.io.sentinel.R;
import sentinelgroup.io.sentinel.SentinelApp;
import sentinelgroup.io.sentinel.di.InjectorModule;
import sentinelgroup.io.sentinel.network.model.VpnListEntity;
import sentinelgroup.io.sentinel.ui.activity.VpnListActivity;
import sentinelgroup.io.sentinel.ui.custom.BlurFlagImageView;
import sentinelgroup.io.sentinel.ui.custom.OnGenericFragmentInteractionListener;
import sentinelgroup.io.sentinel.ui.custom.OnVpnConnectionListener;
import sentinelgroup.io.sentinel.util.AnalyticsHelper;
import sentinelgroup.io.sentinel.util.AppConstants;
import sentinelgroup.io.sentinel.util.AppPreferences;
import sentinelgroup.io.sentinel.util.Convert;
import sentinelgroup.io.sentinel.util.Converter;
import sentinelgroup.io.sentinel.util.SpannableStringUtil;
import sentinelgroup.io.sentinel.viewmodel.VpnConnectedViewModel;
import sentinelgroup.io.sentinel.viewmodel.VpnConnectedViewModelFactory;

/**
 * A simple {@link Fragment} subclass.
 * Activities that contain this fragment must implement the
 * {@link OnGenericFragmentInteractionListener} &
 * (@link {@link OnVpnConnectionListener})interface
 * to handle interaction events.
 * Use the {@link VpnConnectedFragment#newInstance} factory method to
 * create an instance of this fragment.
 */
public class VpnConnectedFragment extends Fragment implements View.OnClickListener {

    private VpnConnectedViewModel mViewModel;

    private OnGenericFragmentInteractionListener mListener;

    private OnVpnConnectionListener mVpnListener;

    private BlurFlagImageView mFvFlag;
    private TextView mTvVpnState, mTvLocation, mTvIp, mTvDownloadSpeed, mTvUploadSpeed, mTvDataUsed,
            mTvBandwidth, mTvLatency, mTvEncMethod, mTvPrice, mTvDuration;
    private Button mBtnDisconnect, mBtnViewVpn;
    private AppCompatImageButton mIbBookmark;
    private VpnListEntity mVpnEntity;

    private Long mConnectionTime = 0L;

    public VpnConnectedFragment() {
        // Required empty public constructor
    }

    /**
     * Use this factory method to create a new instance of
     * this fragment.
     *
     * @return A new instance of fragment VpnConnectedFragment.
     */
    public static VpnConnectedFragment newInstance() {
        return new VpnConnectedFragment();
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        return inflater.inflate(R.layout.fragment_vpn_connected, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        initView(view);
    }

    @Override
    public void onActivityCreated(@Nullable Bundle savedInstanceState) {
        super.onActivityCreated(savedInstanceState);
        fragmentLoaded(getString(R.string.app_name));
        initListeners();
        initViewModel();
    }

    @Override
    public void onStart() {
        super.onStart();
        if (!SentinelApp.isVpnInitiated) {
            loadNextFragment(VpnSelectFragment.newInstance(null));
        }
    }

    private void initView(View iView) {
        mFvFlag = iView.findViewById(R.id.fv_flag);
        mTvVpnState = iView.findViewById(R.id.tv_vpn_state);
        mTvLocation = iView.findViewById(R.id.tv_location);
        mTvIp = iView.findViewById(R.id.tv_ip);
        mIbBookmark = iView.findViewById(R.id.ib_bookmark);
        mTvDownloadSpeed = iView.findViewById(R.id.tv_download_speed);
        mTvUploadSpeed = iView.findViewById(R.id.tv_upload_speed);
        mTvDataUsed = iView.findViewById(R.id.tv_data_used);
        mTvBandwidth = iView.findViewById(R.id.tv_bandwidth);
        mTvLatency = iView.findViewById(R.id.tv_latency);
        mTvEncMethod = iView.findViewById(R.id.tv_enc_method);
        mTvPrice = iView.findViewById(R.id.tv_price);
        mTvDuration = iView.findViewById(R.id.tv_duration);
        mBtnDisconnect = iView.findViewById(R.id.btn_disconnect);
        mBtnViewVpn = iView.findViewById(R.id.btn_view_vpn);
        // set listeners
        mBtnDisconnect.setOnClickListener(this);
        mBtnViewVpn.setOnClickListener(this);
    }

    private void initListeners() {
        mIbBookmark.setOnClickListener(v -> {
            if (mVpnEntity != null) {
                Toast.makeText(getContext(), mVpnEntity.isBookmarked() ? R.string.alert_bookmark_removed : R.string.alert_bookmark_added, Toast.LENGTH_SHORT).show();
                mViewModel.toggleVpnBookmark(mVpnEntity.getAccountAddress(), mVpnEntity.getIp());
            }
        });
    }

    private void initViewModel() {
        // init Device ID
        @SuppressLint("HardwareIds") String aDeviceId = Settings.Secure.getString(getActivity().getContentResolver(), Settings.Secure.ANDROID_ID);

        VpnConnectedViewModelFactory aFactory = InjectorModule.provideVpnConnectedViewModelFactory(getContext(), aDeviceId);
        mViewModel = ViewModelProviders.of(this, aFactory).get(VpnConnectedViewModel.class);

        mViewModel.getVpnLiveData().observe(this, vpnEntity -> {
            if (vpnEntity != null && vpnEntity.getAccountAddress().equals(AppPreferences.getInstance().getString(AppConstants.PREFS_VPN_ADDRESS))) {
                mVpnEntity = vpnEntity;
                setupVpnData(vpnEntity);
            }
        });
    }

    private void setupVpnData(VpnListEntity iVpnEntity) {
        mTvLocation.setText(getString(R.string.vpn_location_city_country, iVpnEntity.getLocation().city, iVpnEntity.getLocation().country));
        // Construct and set - IP SpannableString
        String aIp = getString(R.string.vpn_ip, iVpnEntity.getIp());
        SpannableString aStyledIp = new SpannableStringUtil.SpannableStringUtilBuilder(aIp, iVpnEntity.getIp())
                .color(ContextCompat.getColor(getContext(), R.color.colorTextWhite))
                .relativeSize(1.2f)
                .customStyle(Typeface.BOLD)
                .build();
        mTvIp.setText(aStyledIp);
        // Set country flag
        mFvFlag.setCountryCode(Converter.getCountryCode(iVpnEntity.getLocation().country));

        setBookmarkIcon(iVpnEntity);

        // Set Bandwidth
        mTvBandwidth.setText(getString(R.string.vpn_bandwidth_value, Convert.fromBitsPerSecond(iVpnEntity.getNetSpeed().download, Convert.DataUnit.MBPS)));
        // Set Price
        mTvPrice.setText(getString(R.string.vpn_price_value, iVpnEntity.getPricePerGb()));
        // Set Latency
        mTvLatency.setText(getString(R.string.vpn_latency_value, iVpnEntity.getLatency()));
        // Set Encryption Method
        mTvEncMethod.setText(iVpnEntity.getEncryptionMethod());
    }

    private void setBookmarkIcon(VpnListEntity iVpnEntity) {
        mIbBookmark.setImageResource(iVpnEntity.isBookmarked() ? R.drawable.ic_bookmark_active : R.drawable.ic_bookmark_inactive);
    }

    public void updateStatus(String iState) {
        mTvVpnState.setEnabled(iState.equals(getString(R.string.state_connected)));
        mTvVpnState.setText(getString(R.string.vpn_status, iState));
        mBtnViewVpn.setEnabled(iState.equals(getString(R.string.state_connected)));
    }

    public void updateByteCount(String iDownloadSpeed, String iUploadSpeed, String iTotalDataUsed) {
        if (mTvDownloadSpeed != null && !TextUtils.isEmpty(iDownloadSpeed)) {
            // Construct and set - Download Speed SpannableString
            String aDownloadSubString = iDownloadSpeed.substring(iDownloadSpeed.indexOf(' '));
            SpannableString aDownloadSpannable = new SpannableStringUtil.SpannableStringUtilBuilder(iDownloadSpeed, aDownloadSubString)
                    .color(ContextCompat.getColor(SentinelApp.getAppContext(), R.color.colorTextWhiteWithAlpha70))
                    .relativeSize(0.5f)
                    .build();
            mTvDownloadSpeed.setText(aDownloadSpannable);
        }
        if (mTvUploadSpeed != null && !TextUtils.isEmpty(iUploadSpeed)) {
            // Construct and set - Upload Speed SpannableString
            String aUploadSubString = iUploadSpeed.substring(iUploadSpeed.indexOf(' '));
            SpannableString aUploadSpannable = new SpannableStringUtil.SpannableStringUtilBuilder(iUploadSpeed, aUploadSubString)
                    .color(ContextCompat.getColor(SentinelApp.getAppContext(), R.color.colorTextWhiteWithAlpha70))
                    .relativeSize(0.5f)
                    .build();
            mTvUploadSpeed.setText(aUploadSpannable);
        }
        if (mTvDataUsed != null && !TextUtils.isEmpty(iTotalDataUsed)) {
            // Construct and set - Data used SpannableString
            String aDataUsedSubString = iTotalDataUsed.substring(iTotalDataUsed.indexOf(' '));
            SpannableString aDataUsedSpannable = new SpannableStringUtil.SpannableStringUtilBuilder(iTotalDataUsed, aDataUsedSubString)
                    .color(ContextCompat.getColor(SentinelApp.getAppContext(), R.color.colorTextWhiteWithAlpha70))
                    .relativeSize(0.5f)
                    .build();
            mTvDataUsed.setText(aDataUsedSpannable);
        }
        if (mTvDuration != null) {
            // Construct and set - Duration SpannableString
            if (mConnectionTime == 0L) {
                // Store the VPN connection initiated time
                mConnectionTime = AppPreferences.getInstance().getLong(AppConstants.PREFS_CONNECTION_START_TIME);
            }
            String aDurationValue = mConnectionTime == 0 ? "0" : Converter.getLongDuration((long) (((double) (System.currentTimeMillis() - mConnectionTime)) / 1000));
            mTvDuration.setText(aDurationValue);
        }
    }

    // Interface interaction methods
    public void fragmentLoaded(String iTitle) {
        if (mListener != null) {
            mListener.onFragmentLoaded(iTitle);
        }
    }

    public void showProgressDialog(boolean isHalfDim, String iMessage) {
        if (mListener != null) {
            mListener.onShowProgressDialog(isHalfDim, iMessage);
        }
    }

    public void hideProgressDialog() {
        if (mListener != null) {
            mListener.onHideProgressDialog();
        }
    }

    public void loadNextFragment(Fragment iFragment) {
        if (mListener != null) {
            mListener.onLoadNextFragment(iFragment);
        }
    }

    public void loadNextActivity(Intent iIntent, int iReqCode) {
        if (mListener != null) {
            mListener.onLoadNextActivity(iIntent, iReqCode);
        }
    }

    public void initiateVpnDisconnection() {
        if (mVpnListener != null) {
            mVpnListener.onVpnDisconnectionInitiated();
        }
    }

    @Override
    public void onAttach(Context context) {
        super.onAttach(context);
        if (context instanceof OnGenericFragmentInteractionListener && context instanceof OnVpnConnectionListener) {
            mListener = (OnGenericFragmentInteractionListener) context;
            mVpnListener = (OnVpnConnectionListener) context;
        } else {
            throw new RuntimeException(context.toString()
                    + " must implement OnGenericFragmentInteractionListener & OnVpnConnectionListener");
        }
    }

    @Override
    public void onDetach() {
        hideProgressDialog();
        super.onDetach();
        mListener = null;
        mVpnListener = null;
    }

    @Override
    public void onClick(View v) {
        switch (v.getId()) {
            case R.id.btn_disconnect:
                initiateVpnDisconnection();
                AnalyticsHelper.triggerOVPNDisconnectInit();
                break;

            case R.id.btn_view_vpn:
                loadNextActivity(new Intent(getActivity(), VpnListActivity.class), AppConstants.REQ_VPN_CONNECT);
                getActivity().overridePendingTransition(R.anim.enter_right_to_left, R.anim.exit_left_to_right);
                break;
        }
    }
}