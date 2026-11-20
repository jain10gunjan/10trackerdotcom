package com.tentracker.nativeapp.ui.screens

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.CurrencyRupee
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.Stars
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.util.openSite
import com.tentracker.nativeapp.ui.viewmodel.MoreUiState
import com.tentracker.nativeapp.ui.viewmodel.MoreViewModel

@Composable
fun MoreScreen(
    vm: MoreViewModel,
    signedInHint: Boolean,
    onSignIn: () -> Unit,
    onSignOut: () -> Unit,
) {
    val state by vm.state.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(signedInHint) {
        vm.refresh(silent = state.email != null || !signedInHint)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Spacer(modifier = Modifier.height(12.dp))
        Text("More", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = Ink)
        Text("Account, credits, and pricing.", style = MaterialTheme.typography.bodyMedium, color = Muted)

        AccountCard(
            state = state,
            onSignIn = onSignIn,
            onSignOut = {
                onSignOut()
                vm.onSignedOut()
            },
        )

        if (state.signedIn) {
            CreditsCard(state = state)
        }

        Text("Pricing", fontWeight = FontWeight.Bold, color = Ink)
        Text(
            "Plans stay on 10tracker.com — checkout opens in a secure browser tab.",
            style = MaterialTheme.typography.bodyMedium,
            color = Muted,
        )
        listOf(
            Plan("Free", "Browse exams, limited practice, guest trackers"),
            Plan("Credits", "Pay as you go for mocks & deep practice"),
            Plan("Unlimited", "Full access to practice, mocks, and OG Trackers"),
        ).forEach { plan ->
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, Border, RoundedCornerShape(14.dp))
                    .padding(14.dp),
            ) {
                Text(plan.name, fontWeight = FontWeight.SemiBold, color = Ink)
                Text(plan.blurb, style = MaterialTheme.typography.bodyMedium, color = Muted)
            }
        }
        Button(
            onClick = { openSite(context, "/pricing") },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = Brand),
            shape = RoundedCornerShape(12.dp),
        ) {
            Icon(Icons.Default.CurrencyRupee, contentDescription = null)
            Text("  Open full pricing")
        }

        Text("Also on the web", fontWeight = FontWeight.Bold, color = Ink)
        LinkRow("Mock tests hub", "/mock-test") { openSite(context, it) }
        LinkRow("Roadmaps", "/roadmaps") { openSite(context, it) }
        LinkRow("Leaderboard", "/mock-test/leaderboard") { openSite(context, it) }
        LinkRow("10tracker.com", "/") { openSite(context, it) }

        Spacer(modifier = Modifier.height(24.dp))
    }
}

@Composable
private fun AccountCard(
    state: MoreUiState,
    onSignIn: () -> Unit,
    onSignOut: () -> Unit,
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = BrandSoft),
        shape = RoundedCornerShape(16.dp),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Icon(
                    Icons.Default.AccountCircle,
                    contentDescription = null,
                    tint = Brand,
                    modifier = Modifier.size(36.dp),
                )
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        when {
                            state.loading && state.signedIn -> "Loading account…"
                            state.signedIn -> state.displayName ?: "Signed in"
                            else -> "Guest mode"
                        },
                        fontWeight = FontWeight.Bold,
                        color = Ink,
                    )
                    if (state.signedIn && !state.email.isNullOrBlank()) {
                        Text(state.email, style = MaterialTheme.typography.bodyMedium, color = Muted)
                    }
                }
                if (state.loading || state.refreshing) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        strokeWidth = 2.dp,
                        color = Brand,
                    )
                }
            }

            Text(
                when {
                    !state.signedIn ->
                        "Sign in with Google to save streaks, practice, and watch %."
                    state.needsProfile ->
                        "Finish your profile on the web so mocks and credits unlock fully."
                    else ->
                        "Practice answers and YouTube progress sync to your 10tracker account."
                },
                style = MaterialTheme.typography.bodyMedium,
            )

            state.error?.let {
                Text(it, style = MaterialTheme.typography.bodySmall, color = Ink)
            }

            if (state.signedIn) {
                OutlinedButton(onClick = onSignOut, shape = RoundedCornerShape(12.dp)) {
                    Text("Sign out")
                }
            } else {
                Button(
                    onClick = onSignIn,
                    colors = ButtonDefaults.buttonColors(containerColor = Brand),
                    shape = RoundedCornerShape(12.dp),
                ) { Text("Sign in with Google") }
            }
        }
    }
}

@Composable
private fun CreditsCard(state: MoreUiState) {
    Card(
        colors = CardDefaults.cardColors(containerColor = androidx.compose.ui.graphics.Color.White),
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Icon(Icons.Default.Stars, contentDescription = null, tint = Brand)
                Text("Credits & plan", fontWeight = FontWeight.Bold, color = Ink)
            }

            if (state.unlimited) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Icon(Icons.Default.WorkspacePremium, contentDescription = null, tint = Brand)
                    Column {
                        Text(
                            state.subscription?.planName ?: "Unlimited",
                            fontWeight = FontWeight.SemiBold,
                            color = Ink,
                        )
                        Text(
                            "Premium active — practice, mocks, and OG Trackers unlocked.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Muted,
                        )
                        state.subscription?.expiresAt?.takeIf { it.isNotBlank() }?.let { expires ->
                            Text(
                                "Expires $expires",
                                style = MaterialTheme.typography.labelSmall,
                                color = Muted,
                            )
                        }
                    }
                }
            } else {
                Text(
                    when (val credits = state.credits) {
                        null -> if (state.loading) "…" else "—"
                        else -> "$credits credits"
                    },
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = Ink,
                )
                Text(
                    "Credits unlock mock attempts and deeper practice. Top up or go Unlimited on Pricing.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Muted,
                )
            }
        }
    }
}

private data class Plan(val name: String, val blurb: String)

@Composable
private fun LinkRow(label: String, path: String, onOpen: (String) -> Unit) {
    OutlinedButton(
        onClick = { onOpen(path) },
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
    ) {
        Text(label, modifier = Modifier.weight(1f), color = Ink)
        Icon(Icons.AutoMirrored.Filled.OpenInNew, contentDescription = null, tint = Brand)
    }
}
