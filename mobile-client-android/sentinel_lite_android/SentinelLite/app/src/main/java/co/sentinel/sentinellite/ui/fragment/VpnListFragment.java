package co.sentinel.sentinellite.ui.fragment;

import android.annotation.SuppressLint;
import android.arch.lifecycle.ViewModelProviders;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.provider.Settings;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.support.v4.widget.SwipeRefreshLayout;
import android.support.v7.widget.LinearLayoutManager;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;

import java.util.Objects;

import co.sentinel.sentinellite.R;
import co.sentinel.sentinellite.SentinelLiteApp;
import co.sentinel.sentinellite.di.InjectorModule;
import co.sentinel.sentinellite.network.model.VpnListEntity;
import co.sentinel.sentinellite.ui.activity.DashboardActivity;
import co.sentinel.sentinellite.ui.activity.VpnListActivity;
import co.sentinel.sentinellite.ui.adapter.VpnListAdapter;
import co.sentinel.sentinellite.ui.custom.EmptyRecyclerView;
import co.sentinel.sentinellite.ui.custom.OnGenericFragmentInteractionListener;
import co.sentinel.sentinellite.ui.custom.OnVpnConnectionListener;
import co.sentinel.sentinellite.ui.custom.VpnListSearchListener;
import co.sentinel.sentinellite.ui.dialog.SortFilterByDialogFragment;
import co.sentinel.sentinellite.util.AnalyticsHelper;
import co.sentinel.sentinellite.util.AppConstants;
import co.sentinel.sentinellite.util.Status;
import co.sentinel.sentinellite.viewmodel.VpnListViewModel;
import co.sentinel.sentinellite.viewmodel.VpnListViewModelFactory;

/**
 * A simple {@link Fragment} subclass.
 * Activities that contain this fragment must implement the
 * {@link OnGenericFragmentInteractionListener} &
 * (@link {@link OnVpnConnectionListener})interface
 * to handle interaction events.
 * Use the {@link VpnListFragment#newInstance} factory method to
 * create an instance of this fragment.
 */
public class VpnListFragment extends Fragment implements VpnListAdapter.OnItemClickListener {

    private VpnListViewModel mViewModel;

    private OnGenericFragmentInteractionListener mListener;

    private OnVpnConnectionListener mVpnListener;

    private SwipeRefreshLayout mSrReload;
    private EmptyRecyclerView mRvVpnList;
    private VpnListAdapter mAdapter;

    private SortFilterByDialogFragment.OnSortFilterDialogActionListener mSortDialogActionListener = (iTag, iDialog, isPositiveButton, iSelectedSortType, toFilterByBookmark) -> {
        if (isPositiveButton && iSelectedSortType != null) {
            if (getActivity() instanceof DashboardActivity) {
                ((DashboardActivity) getActivity()).setFilterByBookmark(toFilterByBookmark);
                ((DashboardActivity) getActivity()).setCurrentSortType(iSelectedSortType.getItemCode());
                ((DashboardActivity) getActivity()).toggleItemState();
                getVpnListLiveDataSearchSortFilterBy(((DashboardActivity) getActivity()).getCurrentSearchString(), iSelectedSortType.getItemCode(), toFilterByBookmark);
            } else if (getActivity() instanceof VpnListActivity) {
                ((VpnListActivity) getActivity()).setFilterByBookmark(toFilterByBookmark);
                ((VpnListActivity) getActivity()).setCurrentSortType(iSelectedSortType.getItemCode());
                ((VpnListActivity) getActivity()).toggleItemState();
                getVpnListLiveDataSearchSortFilterBy(((VpnListActivity) getActivity()).getCurrentSearchString(), iSelectedSortType.getItemCode(), toFilterByBookmark);
            }
        }
        iDialog.dismiss();
    };

    private VpnListSearchListener mVpnListSearchListener = iSearchQuery -> {
        if (getActivity() instanceof DashboardActivity)
            getVpnListLiveDataSearchSortFilterBy(iSearchQuery, ((DashboardActivity) getActivity()).getCurrentSortType(), ((DashboardActivity) getActivity()).toFilterByBookmark());
        else if (getActivity() instanceof VpnListActivity)
            getVpnListLiveDataSearchSortFilterBy(iSearchQuery, ((VpnListActivity) getActivity()).getCurrentSortType(), ((VpnListActivity) getActivity()).toFilterByBookmark());
    };

    public VpnListFragment() {
        // Required empty public constructor
    }

    /**
     * Use this factory method to create a new instance of
     * this fragment.
     *
     * @return A new instance of fragment VpnListFragment.
     */
    public static VpnListFragment newInstance() {
        return new VpnListFragment();
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
//        setHasOptionsMenu(true);
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        return inflater.inflate(R.layout.fragment_list, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        initView(view);
    }

    @Override
    public void onActivityCreated(@Nullable Bundle savedInstanceState) {
        super.onActivityCreated(savedInstanceState);
        fragmentLoaded(getString(R.string.vpn_connections));
        initViewModel();
        if (getActivity() instanceof DashboardActivity) {
            ((DashboardActivity) getActivity()).setVpnListSearchListener(mVpnListSearchListener);
            ((DashboardActivity) getActivity()).setSortDialogActionListener(mSortDialogActionListener);
        } else if (getActivity() instanceof VpnListActivity) {
            ((VpnListActivity) getActivity()).setVpnListSearchListener(mVpnListSearchListener);
            ((VpnListActivity) getActivity()).setSortDialogActionListener(mSortDialogActionListener);
        }
    }

    private void initView(View iView) {
        mSrReload = iView.findViewById(R.id.sr_reload);
        mRvVpnList = iView.findViewById(R.id.rv_list);
        TextView aTvEmpty = iView.findViewById(R.id.tv_empty_message);
        // Setup RecyclerView
        mRvVpnList.setLayoutManager(new LinearLayoutManager(getContext(), LinearLayoutManager.VERTICAL, false));
        aTvEmpty.setText(R.string.vpn_empty_list_message);
        mRvVpnList.setEmptyView(aTvEmpty);
        mAdapter = new VpnListAdapter(this, getContext());
        mRvVpnList.setAdapter(mAdapter);
        // setup swipe to refresh layout
        mSrReload.setOnRefreshListener(() -> {
            mViewModel.reloadVpnList();
            mSrReload.setRefreshing(false);
        });
    }

    private void initViewModel() {
        // init Device ID
        @SuppressLint("HardwareIds") String aDeviceId = Settings.Secure.getString(Objects.requireNonNull(getActivity()).getContentResolver(), Settings.Secure.ANDROID_ID);

        VpnListViewModelFactory aFactory = InjectorModule.provideVpnListViewModelFactory(getContext(), aDeviceId);
        mViewModel = ViewModelProviders.of(this, aFactory).get(VpnListViewModel.class);

        if (getActivity() instanceof DashboardActivity)
            getVpnListLiveDataSearchSortFilterBy(((DashboardActivity) getActivity()).getCurrentSearchString(), ((DashboardActivity) getActivity()).getCurrentSortType(), ((DashboardActivity) getActivity()).toFilterByBookmark());
        else if (getActivity() instanceof VpnListActivity)
            getVpnListLiveDataSearchSortFilterBy(((VpnListActivity) getActivity()).getCurrentSearchString(), ((VpnListActivity) getActivity()).getCurrentSortType(), ((VpnListActivity) getActivity()).toFilterByBookmark());
        else
            getVpnListLiveDataSearchSortFilterBy("%%", AppConstants.SORT_BY_DEFAULT, false);

        mViewModel.getVpnListErrorLiveEvent().observe(this, iMessage -> {
            if (iMessage != null && !iMessage.isEmpty() && mAdapter.getItemCount() != 0)
                if (iMessage.equals(AppConstants.ERROR_GENERIC))
                    showSingleActionDialog(AppConstants.VALUE_DEFAULT, getString(R.string.generic_error), AppConstants.VALUE_DEFAULT);
                else
                    showSingleActionDialog(AppConstants.VALUE_DEFAULT, iMessage, AppConstants.VALUE_DEFAULT);
        });
        mViewModel.getVpnGetServerCredentials().observe(this, vpnCredentialsResource -> {
            if (vpnCredentialsResource != null) {
                if (vpnCredentialsResource.status.equals(Status.LOADING)) {
                    showProgressDialog(true, getString(R.string.fetching_server_details));
                } else if (vpnCredentialsResource.data != null && vpnCredentialsResource.status.equals(Status.SUCCESS)) {
                    mViewModel.getVpnConfig(vpnCredentialsResource.data);
                } else if (vpnCredentialsResource.message != null && vpnCredentialsResource.status.equals(Status.ERROR)) {
                    hideProgressDialog();
                    if (vpnCredentialsResource.message.equals(AppConstants.ERROR_GENERIC))
                        showSingleActionDialog(AppConstants.VALUE_DEFAULT, getString(R.string.generic_error), AppConstants.VALUE_DEFAULT);
                    else
                        showSingleActionDialog(AppConstants.VALUE_DEFAULT, vpnCredentialsResource.message, AppConstants.VALUE_DEFAULT);
                }
            }
        });
        mViewModel.getVpnConfigLiveEvent().observe(this, vpnConfigResource -> {
            if (vpnConfigResource != null) {
                if (vpnConfigResource.status.equals((Status.LOADING))) {
                    showProgressDialog(true, getString(R.string.fetching_config));
                } else if (vpnConfigResource.data != null && vpnConfigResource.status.equals(Status.SUCCESS)) {
                    mViewModel.saveCurrentVpnSessionConfig(vpnConfigResource.data);
                } else if (vpnConfigResource.message != null && vpnConfigResource.status.equals(Status.ERROR)) {
                    hideProgressDialog();
                    if (vpnConfigResource.message.equals(AppConstants.ERROR_GENERIC))
                        showSingleActionDialog(AppConstants.VALUE_DEFAULT, getString(R.string.generic_error), AppConstants.VALUE_DEFAULT);
                    else
                        showSingleActionDialog(AppConstants.VALUE_DEFAULT, vpnConfigResource.message, AppConstants.VALUE_DEFAULT);
                }
            }
        });
        mViewModel.getVpnConfigSaveLiveEvent().observe(this, vpnConfigSaveResource -> {
            if (vpnConfigSaveResource != null) {
                if (vpnConfigSaveResource.status.equals(Status.LOADING)) {
                    showProgressDialog(true, getString(R.string.saving_config));
                } else if (vpnConfigSaveResource.data != null && vpnConfigSaveResource.status.equals(Status.SUCCESS)) {
                    hideProgressDialog();
                    initiateVpnConnection(vpnConfigSaveResource.data);
                } else if (vpnConfigSaveResource.message != null && vpnConfigSaveResource.status.equals(Status.ERROR)) {
                    hideProgressDialog();
                    showSingleActionDialog(AppConstants.VALUE_DEFAULT, vpnConfigSaveResource.message, AppConstants.VALUE_DEFAULT);
                }
            }
        });
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

    public void showSingleActionDialog(int iTitleId, String iMessage, int iPositiveOptionId) {
        if (mListener != null) {
            mListener.onShowSingleActionDialog(iTitleId, iMessage, iPositiveOptionId);
        }
    }

    private void showDoubleActionDialog(String iTag, int iTitleId, String iMessage, int iPositiveOptionId, int iNegativeOptionId) {
        if (mListener != null) {
            mListener.onShowDoubleActionDialog(iTag, iTitleId, iMessage, iPositiveOptionId, iNegativeOptionId);
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

    public void initiateVpnConnection(String iVpnConfigFilePath) {
        if (mVpnListener != null) {
            mVpnListener.onVpnConnectionInitiated(iVpnConfigFilePath);
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
        mVpnListSearchListener = null;
        mSortDialogActionListener = null;
        if (getActivity() instanceof DashboardActivity) {
            ((DashboardActivity) getActivity()).removeVpnListSearchListener();
            ((DashboardActivity) getActivity()).removeSortDialogActionListener();
        } else if (getActivity() instanceof VpnListActivity) {
            ((VpnListActivity) getActivity()).removeVpnListSearchListener();
            ((VpnListActivity) getActivity()).removeSortDialogActionListener();
        }
    }

    @Override
    public void onRootViewClicked(VpnListEntity iItemData) {
        if (getActivity() instanceof DashboardActivity) {
            Intent aIntent = new Intent(getActivity(), VpnListActivity.class);
            aIntent.putExtra(AppConstants.EXTRA_VPN_LIST, iItemData);
            loadNextActivity(aIntent, AppConstants.REQ_VPN_CONNECT);
            getActivity().overridePendingTransition(R.anim.enter_right_to_left, R.anim.exit_left_to_right);
        } else {
            loadNextFragment(VpnDetailsFragment.newInstance(iItemData));
        }
    }

    @Override
    public void onConnectClicked(String iVpnAddress) {
        if (!SentinelLiteApp.isVpnConnected) {
            mViewModel.getVpnServerCredentials(iVpnAddress);
            AnalyticsHelper.triggerOVPNConnectInit();
        } else
            showSingleActionDialog(AppConstants.VALUE_DEFAULT, getString(R.string.vpn_already_connected), AppConstants.VALUE_DEFAULT);
    }

    @Override
    public void onBookmarkClicked(VpnListEntity iItemData) {
        mViewModel.toggleVpnBookmark(iItemData.getAccountAddress(), iItemData.getIp());
        Toast.makeText(getContext(), iItemData.isBookmarked() ? R.string.alert_bookmark_removed : R.string.alert_bookmark_added, Toast.LENGTH_SHORT).show();
    }

    public void getVpnListLiveDataSearchSortFilterBy(String iSearchQuery, String iSelectedSortType, boolean toFilterByBookmark) {
        if (mViewModel != null) {
            mViewModel.getVpnListLiveDataSearchSortFilterBy(iSearchQuery, iSelectedSortType, toFilterByBookmark).observe(this, vpnList -> {
                if (vpnList != null) {
                    mAdapter.loadData(vpnList);
                    mRvVpnList.scrollToPosition(0);
                }
            });
        }
    }

}
