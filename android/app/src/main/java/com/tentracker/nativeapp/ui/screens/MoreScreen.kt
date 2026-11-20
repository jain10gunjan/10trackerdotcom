package com.tentracker.nativeapp.ui.screens

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.CurrencyRupee
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.util.openSite

@Composable
fun MoreScreen(
    signedIn: Boolean,
    onSignIn: () -> Unit,
    onSignOut: () -> Unit,
) {
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Spacer(modifier = Modifier.height(12.dp))
        Text("More", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = Ink)
        Text("Account, pricing, and web tools.", style = MaterialTheme.typography.bodyMedium, color = Muted)

        Card(
            colors = CardDefaults.cardColors(containerColor = BrandSoft),
            shape = RoundedCornerShape(16.dp),
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Icon(Icons.Default.AccountCircle, contentDescription = null, tint = Brand)
                Text(
                    if (signedIn) "You're signed in" else "Guest mode",
                    fontWeight = FontWeight.Bold,
                    color = Ink,
                )
                Text(
                    if (signedIn) {
                        "Practice answers and YouTube progress sync to your 10tracker account."
                    } else {
                        "Sign in with Google to save streaks, practice, and watch %."
                    },
                    style = MaterialTheme.typography.bodyMedium,
                )
                if (signedIn) {
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

        Text("Pricing", fontWeight = FontWeight.Bold, color = Ink)
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
        Icon(Icons.Default.OpenInNew, contentDescription = null, tint = Brand)
    }
}
