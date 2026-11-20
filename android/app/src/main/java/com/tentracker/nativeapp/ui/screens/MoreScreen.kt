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
import androidx.compose.foundation.layout.fillMaxSize
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
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.Article
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material.icons.filled.CurrencyRupee
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Stars
import androidx.compose.material.icons.filled.Timeline
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
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
import com.tentracker.nativeapp.ui.theme.SurfaceMuted
import com.tentracker.nativeapp.ui.viewmodel.MoreUiState
import com.tentracker.nativeapp.ui.viewmodel.MoreViewModel

@Composable
fun MoreScreen(
    vm: MoreViewModel,
    signedInHint: Boolean,
    onSignIn: () -> Unit,
    onSignOut: () -> Unit,
    onOpenRoadmaps: () -> Unit,
    onOpenExams: () -> Unit,
    onOpenTrackers: () -> Unit,
    onOpenArticles: () -> Unit,
    onOpenWeb: (pathOrUrl: String, title: String?) -> Unit = { _, _ -> },
) {
    val state by vm.state.collectAsState()

    LaunchedEffect(signedInHint) {
        vm.refresh(silent = state.email != null || !signedInHint)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceMuted)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Spacer(modifier = Modifier.height(8.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("Explore", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.SemiBold, color = Ink)
        }

        if (state.signedIn) {
            SignedInAccountHeader(state = state)
        } else {
            GuestAccountCard(onSignIn = onSignIn)
        }

        if (state.signedIn) {
            WalletCreditsRow(state = state, onOpenPricing = { onOpenWeb("/pricing", "Pricing") })
        }

        SectionLabel("Practice")
        SheetLinkRow("Exams & practice", Icons.Default.Book, onClick = onOpenExams)
        SheetLinkRow("OG Trackers", Icons.Default.Timeline, onClick = onOpenTrackers)
        SheetLinkRow("Roadmaps", Icons.Default.Map, onClick = onOpenRoadmaps)
        SheetLinkRow("Updates", Icons.Default.Article, onClick = onOpenArticles)

        SectionLabel("More")
        SheetLinkRow("Latest jobs", Icons.Default.CardGiftcard) { onOpenWeb("/article/latest-jobs", "Jobs") }
        SheetLinkRow("About", Icons.Default.Info) { onOpenWeb("/about-us", "About") }
        SheetLinkRow("Contact", Icons.Default.Email) { onOpenWeb("/contact-us", "Contact") }

        SectionLabel("Pricing")
        Text(
            "Unlimited practice plans · one-time purchase · checkout on 10tracker.com",
            style = MaterialTheme.typography.bodyMedium,
            color = Muted,
        )
        listOf(
            PlanCard(
                name = "24-Hour Unlimited",
                description = "Unlimited practice & mock tests for exactly 24 hours from purchase",
                price = "₹5",
                badge = "Try unlimited",
            ),
            PlanCard(
                name = "3 Months Unlimited",
                description = "Full access for 90 days — best for serious prep",
                price = "₹100",
                badge = "Popular",
                highlighted = true,
            ),
            PlanCard(
                name = "6 Months Unlimited",
                description = "Full access for 180 days — maximum savings",
                price = "₹149",
                badge = "Best value",
            ),
        ).forEach { plan ->
            PricingPlanCard(plan)
        }
        Button(
            onClick = { onOpenWeb("/pricing", "Pricing") },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = Ink),
            shape = RoundedCornerShape(12.dp),
        ) {
            Icon(Icons.Default.CurrencyRupee, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text("Open full pricing", fontWeight = FontWeight.SemiBold)
        }

        SectionLabel("Also on the web")
        SheetLinkRow("Mock tests hub", Icons.AutoMirrored.Filled.OpenInNew) { onOpenWeb("/mock-test", "Mock tests") }
        SheetLinkRow("Leaderboard", Icons.AutoMirrored.Filled.OpenInNew) { onOpenWeb("/mock-test/leaderboard", "Leaderboard") }
        SheetLinkRow("Checkout / credits", Icons.AutoMirrored.Filled.OpenInNew) { onOpenWeb("/checkout", "Checkout") }
        SheetLinkRow("10tracker.com", Icons.AutoMirrored.Filled.OpenInNew) { onOpenWeb("/", "10tracker") }

        if (state.signedIn) {
            Spacer(modifier = Modifier.height(4.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .clickable {
                        onSignOut()
                        vm.onSignedOut()
                    }
                    .padding(vertical = 10.dp, horizontal = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Icon(Icons.Default.Logout, contentDescription = null, tint = Color(0xFFDC2626), modifier = Modifier.size(18.dp))
                Text("Sign out", color = Color(0xFFDC2626), fontWeight = FontWeight.Medium, fontSize = 14.sp)
            }
        }

        SectionLabel("Legal")
        LegalChips(onOpenWeb)

        Spacer(modifier = Modifier.height(24.dp))
    }
}

@Composable
private fun SectionLabel(text: String) {
    Text(
        text.uppercase(),
        style = MaterialTheme.typography.labelSmall,
        fontWeight = FontWeight.SemiBold,
        color = Muted,
        letterSpacing = 1.2.sp,
        modifier = Modifier.padding(start = 4.dp, top = 4.dp),
    )
}

@Composable
private fun SignedInAccountHeader(state: MoreUiState) {
    val label = when {
        state.loading && state.signedIn -> "Loading account…"
        else -> state.displayName ?: "Signed in"
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
            Text(label, fontWeight = FontWeight.SemiBold, color = Ink, maxLines = 1, overflow = TextOverflow.Ellipsis)
            state.email?.let {
                Text(it, style = MaterialTheme.typography.bodySmall, color = Muted, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            if (state.needsProfile) {
                Text(
                    "Finish your profile on the web for full mocks & credits.",
                    style = MaterialTheme.typography.bodySmall,
                    color = Muted,
                    modifier = Modifier.padding(top = 4.dp),
                )
            }
        }
        if (state.loading || state.refreshing) {
            CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp, color = Brand)
        }
    }
}

@Composable
private fun GuestAccountCard(onSignIn: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Guest mode", fontWeight = FontWeight.Bold, color = Ink)
            Text(
                "Sign in with Google to save streaks, practice, and watch %.",
                style = MaterialTheme.typography.bodyMedium,
                color = Muted,
            )
            Button(
                onClick = onSignIn,
                colors = ButtonDefaults.buttonColors(containerColor = Brand),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Sign in with Google")
            }
        }
    }
}

@Composable
private fun WalletCreditsRow(state: MoreUiState, onOpenPricing: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onOpenPricing)
            .background(if (state.unlimited) EmeraldSoft else Color.White)
            .border(
                1.dp,
                if (state.unlimited) EmeraldBorder else Border,
                RoundedCornerShape(12.dp),
            )
            .padding(horizontal = 14.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        if (state.unlimited) {
            Icon(Icons.Default.WorkspacePremium, contentDescription = null, tint = EmeraldDark, modifier = Modifier.size(18.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    state.subscription?.planName ?: "Unlimited",
                    fontWeight = FontWeight.SemiBold,
                    color = EmeraldDark,
                    fontSize = 14.sp,
                )
                state.subscription?.expiresAt?.takeIf { it.isNotBlank() }?.let {
                    Text("until $it", fontSize = 12.sp, color = EmeraldDark.copy(alpha = 0.8f))
                }
            }
        } else {
            Icon(Icons.Default.Stars, contentDescription = null, tint = AmberCoin, modifier = Modifier.size(18.dp))
            Text(
                when (val credits = state.credits) {
                    null -> if (state.loading) "…" else "—"
                    else -> "$credits"
                },
                fontWeight = FontWeight.Bold,
                color = Ink,
                fontSize = 15.sp,
            )
            Text("credits", color = Muted, fontSize = 13.sp, modifier = Modifier.weight(1f))
        }
        Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = Muted, modifier = Modifier.size(16.dp))
    }
}

@Composable
private fun SheetLinkRow(
    label: String,
    icon: ImageVector,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Icon(icon, contentDescription = null, tint = Muted, modifier = Modifier.size(18.dp))
        Text(label, fontSize = 14.sp, fontWeight = FontWeight.Medium, color = Ink, modifier = Modifier.weight(1f))
        Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = Muted, modifier = Modifier.size(16.dp))
    }
}

private data class PlanCard(
    val name: String,
    val description: String,
    val price: String,
    val badge: String? = null,
    val highlighted: Boolean = false,
)

@Composable
private fun PricingPlanCard(plan: PlanCard) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(if (plan.highlighted) BrandSoft else Color.White)
            .border(1.dp, if (plan.highlighted) Brand else Border, RoundedCornerShape(16.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(plan.name, fontWeight = FontWeight.SemiBold, color = Ink)
            Text(plan.price, fontWeight = FontWeight.Bold, color = if (plan.highlighted) SheetActiveText else Ink)
        }
        plan.badge?.let {
            Text(
                it,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = EmeraldDark,
                modifier = Modifier
                    .clip(RoundedCornerShape(999.dp))
                    .background(EmeraldSoft)
                    .padding(horizontal = 8.dp, vertical = 3.dp),
            )
        }
        Text(plan.description, style = MaterialTheme.typography.bodyMedium, color = Muted)
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
                    .padding(horizontal = 12.dp, vertical = 8.dp),
            )
        }
    }
}