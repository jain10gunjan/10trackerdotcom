package com.tentracker.nativeapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AllInclusive
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Route
import androidx.compose.material.icons.filled.Stars
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tentracker.nativeapp.ui.theme.AmberCoin
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandSoft
import com.tentracker.nativeapp.ui.theme.EmeraldBorder
import com.tentracker.nativeapp.ui.theme.EmeraldDark
import com.tentracker.nativeapp.ui.theme.EmeraldSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.theme.SheetActiveText
import com.tentracker.nativeapp.ui.viewmodel.MoreUiState
import com.tentracker.nativeapp.ui.viewmodel.MoreViewModel

@Composable
fun MoreScreen(
    vm: MoreViewModel,
    signedInHint: Boolean,
    activeTabRoute: String,
    onSignIn: () -> Unit,
    onSignOut: () -> Unit,
    onOpenTrackers: () -> Unit,
    onOpenHome: () -> Unit,
    onOpenWeb: (pathOrUrl: String, title: String?) -> Unit,
    onOpenPricing: () -> Unit,
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                "Explore",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = Ink,
            )
        }
        MoreSheetScrollContent(
            vm = vm,
            signedInHint = signedInHint,
            activeTabRoute = activeTabRoute,
            onSignIn = onSignIn,
            onSignOut = onSignOut,
            onOpenTrackers = onOpenTrackers,
            onOpenHome = onOpenHome,
            onOpenWeb = onOpenWeb,
            onOpenPricing = onOpenPricing,
            dismissOnNavigate = false,
        )
    }
}

@Composable
fun MoreSheetScrollContent(
    vm: MoreViewModel,
    signedInHint: Boolean,
    activeTabRoute: String,
    onSignIn: () -> Unit,
    onSignOut: () -> Unit,
    onOpenTrackers: () -> Unit,
    onOpenHome: () -> Unit,
    onOpenWeb: (pathOrUrl: String, title: String?) -> Unit,
    onOpenPricing: () -> Unit,
    dismissOnNavigate: Boolean,
    onDismiss: (() -> Unit)? = null,
) {
    val state by vm.state.collectAsState()

    LaunchedEffect(signedInHint) {
        vm.refresh(silent = state.email != null || !signedInHint)
    }

    val dismiss = {
        if (dismissOnNavigate) onDismiss?.invoke()
    }

    MoreExploreBody(
        state = state,
        activeTabRoute = activeTabRoute,
        onSignIn = {
            onSignIn()
            if (dismissOnNavigate) onDismiss?.invoke()
        },
        onSignOut = {
            onSignOut()
            vm.onSignedOut()
            if (dismissOnNavigate) onDismiss?.invoke()
        },
        onOpenTrackers = {
            onOpenTrackers()
            dismiss()
        },
        onOpenHome = {
            onOpenHome()
            dismiss()
        },
        onOpenWeb = { path, title ->
            onOpenWeb(path, title)
            dismiss()
        },
        onOpenPricing = {
            onOpenPricing()
            dismiss()
        },
        modifier = Modifier.padding(horizontal = 16.dp),
    )
}

@Composable
fun MoreSheetChrome(onDismiss: () -> Unit) {
    Column {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 12.dp, bottom = 4.dp),
            contentAlignment = Alignment.Center,
        ) {
            Box(
                modifier = Modifier
                    .width(40.dp)
                    .height(4.dp)
                    .clip(RoundedCornerShape(99.dp))
                    .background(Border),
            )
        }
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .padding(bottom = 12.dp, top = 4.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                "Explore",
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                color = Ink,
            )
            IconButton(onClick = onDismiss) {
                Icon(Icons.Default.Close, contentDescription = "Close", tint = Muted, modifier = Modifier.size(20.dp))
            }
        }
        HorizontalDivider(color = Color(0xFFF5F5F5))
    }
}

@Composable
private fun MoreExploreBody(
    state: MoreUiState,
    activeTabRoute: String,
    onSignIn: () -> Unit,
    onSignOut: () -> Unit,
    onOpenTrackers: () -> Unit,
    onOpenHome: () -> Unit,
    onOpenWeb: (pathOrUrl: String, title: String?) -> Unit,
    onOpenPricing: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .verticalScroll(rememberScrollState())
            .padding(vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        if (state.signedIn) {
            SignedInAccountHeader(
                state = state,
                onOpenPricing = onOpenPricing,
            )
            Spacer(modifier = Modifier.height(8.dp))
        }

        SectionLabel("Practice")
        SheetNavRow(
            label = "OG Trackers",
            icon = Icons.Default.Route,
            active = activeTabRoute == "tab_trackers",
            onClick = onOpenTrackers,
        )
        if (state.signedIn) {
            SheetNavRow(
                label = "My progress",
                icon = Icons.Default.BarChart,
                active = activeTabRoute == "tab_home",
                onClick = onOpenHome,
            )
        }

        Spacer(modifier = Modifier.height(8.dp))
        SectionLabel("More")
        SheetNavRow(
            label = "Jobs",
            icon = Icons.Default.CardGiftcard,
            active = false,
            onClick = { onOpenWeb("/article/latest-jobs", "Jobs") },
        )
        SheetNavRow(
            label = "About",
            icon = Icons.Default.Info,
            active = false,
            onClick = { onOpenWeb("/about-us", "About") },
        )
        SheetNavRow(
            label = "Contact",
            icon = Icons.Default.Email,
            active = false,
            onClick = { onOpenWeb("/contact-us", "Contact") },
        )

        if (state.signedIn) {
            Spacer(modifier = Modifier.height(8.dp))
            HorizontalDivider(color = Color(0xFFF5F5F5), modifier = Modifier.padding(vertical = 8.dp))
            SheetNavRow(
                label = "Edit profile",
                icon = Icons.Default.Person,
                active = false,
                onClick = { onOpenWeb("/profile?redirect=/", "Profile") },
            )
            SheetNavRow(
                label = "Sign out",
                icon = Icons.Default.Logout,
                active = false,
                destructive = true,
                onClick = onSignOut,
            )
        } else {
            Spacer(modifier = Modifier.height(8.dp))
            HorizontalDivider(color = Color(0xFFF5F5F5), modifier = Modifier.padding(vertical = 8.dp))
            OutlinedButton(
                onClick = onSignIn,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                colors = ButtonDefaults.outlinedButtonColors(containerColor = Color.White),
            ) {
                Text("Sign in with Google", color = Ink, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
            }
        }

        Spacer(modifier = Modifier.height(8.dp))
        SectionLabel("Legal")
        LegalChips(onOpenWeb)
        Spacer(modifier = Modifier.height(8.dp))
    }
}

@Composable
private fun SectionLabel(text: String) {
    Text(
        text.uppercase(),
        fontSize = 11.sp,
        fontWeight = FontWeight.SemiBold,
        color = Muted,
        letterSpacing = 1.2.sp,
        modifier = Modifier.padding(start = 4.dp, bottom = 4.dp, top = 4.dp),
    )
}

@Composable
private fun SignedInAccountHeader(
    state: MoreUiState,
    onOpenPricing: () -> Unit,
) {
    val label = when {
        state.loading && state.signedIn -> "Loading account…"
        else -> state.displayName ?: "Account"
    }
    val initial = (label.firstOrNull() ?: 'U').uppercaseChar().toString()
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFFFAFAFA))
            .border(1.dp, Border, RoundedCornerShape(16.dp))
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(Ink),
            contentAlignment = Alignment.Center,
        ) {
            Text(initial, color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(label, fontWeight = FontWeight.SemiBold, color = Ink, maxLines = 1, overflow = TextOverflow.Ellipsis, fontSize = 14.sp)
            state.email?.let {
                Text(it, fontSize = 12.sp, color = Muted, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
        when {
            state.loading && state.credits == null && !state.unlimited ->
                Box(
                    modifier = Modifier
                        .size(width = 80.dp, height = 32.dp)
                        .clip(RoundedCornerShape(999.dp))
                        .background(Color(0xFFF5F5F5)),
                )
            else -> CompactWalletChip(state = state, onClick = onOpenPricing)
        }
        if (state.refreshing) {
            CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp, color = Brand)
        }
    }
}

/** Compact wallet chip aligned with web [WalletBar] `compact` mode. */
@Composable
private fun CompactWalletChip(state: MoreUiState, onClick: () -> Unit) {
    val shape = RoundedCornerShape(999.dp)
    val bg = if (state.unlimited) EmeraldSoft else Color.White
    val borderColor = if (state.unlimited) EmeraldBorder else Border
    Row(
        modifier = Modifier
            .clip(shape)
            .clickable(onClick = onClick)
            .background(bg)
            .border(1.dp, borderColor, shape)
            .padding(horizontal = 10.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        if (state.unlimited) {
            Icon(Icons.Default.AllInclusive, contentDescription = null, tint = EmeraldDark, modifier = Modifier.size(14.dp))
            Text(
                state.subscription?.planName?.takeIf { it.isNotBlank() } ?: "Unlimited",
                fontWeight = FontWeight.SemiBold,
                color = EmeraldDark,
                fontSize = 12.sp,
            )
        } else {
            Icon(Icons.Default.Stars, contentDescription = null, tint = AmberCoin, modifier = Modifier.size(14.dp))
            Text(
                when (val credits = state.credits) {
                    null -> if (state.loading) "…" else "—"
                    else -> "$credits"
                },
                fontWeight = FontWeight.SemiBold,
                color = Ink,
                fontSize = 12.sp,
            )
            Text("credits", color = Muted, fontSize = 12.sp)
        }
    }
}

@Composable
private fun SheetNavRow(
    label: String,
    icon: ImageVector,
    active: Boolean,
    onClick: () -> Unit,
    destructive: Boolean = false,
) {
    val bg = if (active) BrandSoft else Color.Transparent
    val textColor = when {
        destructive -> Color(0xFFDC2626)
        active -> SheetActiveText
        else -> Color(0xFF404040)
    }
    val iconTint = if (destructive) Color(0xFFDC2626) else Muted
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(bg)
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Icon(icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(18.dp))
        Text(label, fontSize = 14.sp, fontWeight = FontWeight.Medium, color = textColor)
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun LegalChips(onOpenWeb: (pathOrUrl: String, title: String?) -> Unit) {
    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        listOf(
            "Privacy" to "/privacy-policy",
            "Terms" to "/terms-and-services",
            "Disclaimer" to "/disclaimer",
        ).forEach { (label, path) ->
            Text(
                label,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
                color = Muted,
                modifier = Modifier
                    .clip(RoundedCornerShape(999.dp))
                    .clickable { onOpenWeb(path, label) }
                    .background(Color(0xFFFAFAFA))
                    .border(1.dp, Border, RoundedCornerShape(999.dp))
                    .padding(horizontal = 12.dp, vertical = 6.dp),
            )
        }
    }
}