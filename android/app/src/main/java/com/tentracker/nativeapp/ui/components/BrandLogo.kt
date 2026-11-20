package com.tentracker.nativeapp.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
// Modifier is androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.graphics.Color
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.Ink

@Composable
fun BrandLogo(
    modifier: Modifier = Modifier,
    nameSize: TextUnit = 22.sp,
    badgeSize: TextUnit = 8.sp,
    badgeHeight: Dp = 14.dp,
) {
    Row(modifier = modifier, verticalAlignment = Alignment.Bottom) {
        Text(
            text = "10tracker",
            color = Ink,
            fontWeight = FontWeight.Black,
            fontSize = nameSize,
            letterSpacing = (-0.5).sp,
        )
        Text(
            text = ".COM",
            color = Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = badgeSize,
            modifier = Modifier
                .padding(start = 3.dp, bottom = 3.dp)
                .clip(RoundedCornerShape(3.dp))
                .background(Brand)
                .padding(horizontal = 4.dp, vertical = 1.dp)
        )
    }
}
