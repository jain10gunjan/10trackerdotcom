package com.tentracker.nativeapp.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.data.AuthSessionUser
import com.tentracker.nativeapp.data.CreditsSubscription
import com.tentracker.nativeapp.data.SessionStore
import com.tentracker.nativeapp.data.UserProfile
import com.tentracker.nativeapp.data.UserProfileSuggested
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class MoreUiState(
    val loading: Boolean = true,
    val refreshing: Boolean = false,
    val signedIn: Boolean = false,
    val email: String? = null,
    val displayName: String? = null,
    val credits: Int? = null,
    val unlimited: Boolean = false,
    val subscription: CreditsSubscription? = null,
    val needsProfile: Boolean = false,
    val error: String? = null,
)

class MoreViewModel(
    private val api: ApiClient,
    private val sessionStore: SessionStore,
) : ViewModel() {

    private val _state = MutableStateFlow(
        MoreUiState(signedIn = sessionStore.hasSessionCookie() || sessionStore.signedInHint)
    )
    val state: StateFlow<MoreUiState> = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh(silent: Boolean = false) {
        viewModelScope.launch {
            val cookieSignedIn = sessionStore.hasSessionCookie() || sessionStore.signedInHint
            _state.update {
                it.copy(
                    loading = !silent && it.loading,
                    refreshing = silent,
                    error = null,
                    signedIn = cookieSignedIn,
                )
            }

            if (!cookieSignedIn) {
                _state.update {
                    MoreUiState(loading = false, refreshing = false, signedIn = false)
                }
                return@launch
            }

            try {
                val sessionDeferred = async { runCatching { api.getAuthSession() }.getOrNull() }
                val profileDeferred = async { runCatching { api.getUserProfile() }.getOrNull() }
                val walletDeferred = async { runCatching { api.getCreditsWallet() }.getOrNull() }

                val session = sessionDeferred.await()
                val profile = profileDeferred.await()
                val wallet = walletDeferred.await()

                val stillSignedIn = sessionStore.hasSessionCookie() ||
                    session?.user?.email != null ||
                    wallet?.success == true

                if (!stillSignedIn && profile?.success != true) {
                    sessionStore.signedInHint = false
                    _state.update {
                        MoreUiState(loading = false, refreshing = false, signedIn = false)
                    }
                    return@launch
                }

                sessionStore.signedInHint = true
                val user = session?.user
                val name = resolveDisplayName(user, profile?.profile, profile?.suggested)
                val email = resolveEmail(user, profile?.profile, profile?.suggested, wallet?.email)

                _state.update {
                    it.copy(
                        loading = false,
                        refreshing = false,
                        signedIn = true,
                        email = email,
                        displayName = name,
                        credits = wallet?.credits,
                        unlimited = wallet?.unlimited == true,
                        subscription = wallet?.subscription,
                        needsProfile = profile?.needsProfile == true ||
                            profile?.needsProfileCompletion == true,
                        error = when {
                            wallet != null && !wallet.success && wallet.error != null -> wallet.error
                            profile != null && !profile.success && profile.error != null &&
                                profile.error != "Authentication required" -> profile.error
                            else -> null
                        },
                    )
                }
            } catch (e: Exception) {
                _state.update {
                    it.copy(
                        loading = false,
                        refreshing = false,
                        error = e.message ?: "Failed to load account",
                        signedIn = sessionStore.hasSessionCookie() || sessionStore.signedInHint,
                    )
                }
            }
        }
    }

    fun onSignedOut() {
        _state.value = MoreUiState(loading = false, signedIn = false)
    }

    private fun resolveDisplayName(
        user: AuthSessionUser?,
        profile: UserProfile?,
        suggested: UserProfileSuggested?,
    ): String? {
        profile?.display_name?.takeIf { it.isNotBlank() }?.let { return it }
        val fromProfile = listOfNotNull(profile?.first_name, profile?.last_name)
            .joinToString(" ")
            .trim()
        if (fromProfile.isNotBlank()) return fromProfile
        val fromSuggested = listOfNotNull(suggested?.first_name, suggested?.last_name)
            .joinToString(" ")
            .trim()
        if (fromSuggested.isNotBlank()) return fromSuggested
        return user?.name?.takeIf { it.isNotBlank() }
    }

    private fun resolveEmail(
        user: AuthSessionUser?,
        profile: UserProfile?,
        suggested: UserProfileSuggested?,
        walletEmail: String?,
    ): String? =
        user?.email?.takeIf { it.isNotBlank() }
            ?: suggested?.email?.takeIf { it.isNotBlank() }
            ?: profile?.email?.takeIf { it.isNotBlank() }
            ?: profile?.user_email?.takeIf { it.isNotBlank() }
            ?: walletEmail?.takeIf { it.isNotBlank() }

    companion object {
        fun factory(api: ApiClient, sessionStore: SessionStore) =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return MoreViewModel(api, sessionStore) as T
                }
            }
    }
}
