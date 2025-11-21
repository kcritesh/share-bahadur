# 🎨 Stock Details Page - Design Preview

## Visual Hierarchy & Layout

### 📱 Mobile First Design
```
┌─────────────────────────────────────┐
│  Hero Section                       │
│  ┌───────────────────────────────┐  │
│  │ Stock Symbol Info             │  │
│  │ [★ Add to Watchlist Button]  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ✨ AI-POWERED ANALYSIS Badge        │
│  ╔═══════════════════════════════╗  │
│  ║ 📊 LINEAR REGRESSION CHANNEL  ║  │
│  ╠═══════════════════════════════╣  │
│  ║  🟢 BUY SIGNAL - 85% conf.   ║  │
│  ║  Price near lower band...     ║  │
│  ╠═══════════════════════════════╣  │
│  ║ [Current] [Predicted]         ║  │
│  ║ [Upper]   [Lower]             ║  │
│  ╠═══════════════════════════════╣  │
│  ║ ▓▓▓▓▓░░░░░░░░░░░ Position   ║  │
│  ╠═══════════════════════════════╣  │
│  ║ 📊 Model Details (expand)     ║  │
│  ╚═══════════════════════════════╝  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📈 Technical Analysis & Indicators  │
│  [EMA] [MACD] [RSI] [BB] [ADX]     │
│  ┌───────────────────────────────┐  │
│  │   Interactive Chart Widget    │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘

┌──────────────┬──────────────────────┐
│ Price Chart  │  Technical Summary   │
└──────────────┴──────────────────────┘

┌──────────────┬──────────────────────┐
│ Company      │  Financial           │
│ Profile      │  Statements          │
└──────────────┴──────────────────────┘
```

## 🎨 Color Palette

### Signal Colors
```css
/* Buy Signal */
🟢 Green: #22c55e (success)
Background: gradient from green-50 to green-100

/* Sell Signal */
🔴 Red: #ef4444 (danger)
Background: gradient from red-50 to red-100

/* Hold Signal */
🟡 Yellow: #eab308 (warning)
Background: gradient from yellow-50 to yellow-100

/* Predicted Price */
🔵 Blue: #3b82f6 (info)
Background: gradient from blue-50 to blue-100
```

### Brand Colors
```css
/* Primary Gradient */
From: #a855f7 (Purple 500)
To:   #3b82f6 (Blue 500)

/* Card Backgrounds */
Main: oklch(0.97 0.002 250)
Gradient: from-card via-card to-primary/5

/* Borders */
Standard: border-2
Enhanced: border with shadow-xl
```

## 🎯 Component Features

### Linear Regression Component

#### Signal Card
```
╔═══════════════════════════════════════╗
║  🟢  BUY SIGNAL  [85% confidence]    ║
║                                       ║
║  Price ($145.32) is near the lower   ║
║  band ($142.50), suggesting the      ║
║  stock may be oversold...            ║
╚═══════════════════════════════════════╝
```

#### Price Metrics (4 Cards)
```
┌──────────────┐ ┌──────────────┐
│ 🎯 Current   │ │ 📈 Predicted │
│ $145.32      │ │ $148.75      │
│ Live market  │ │ AI regression│
└──────────────┘ └──────────────┘

┌──────────────┐ ┌──────────────┐
│ 📊 Upper     │ │ 📉 Lower     │
│ $155.20      │ │ $142.30      │
│ 6.8% away    │ │ 2.1% away    │
└──────────────┘ └──────────────┘
```

#### Position Visualizer
```
Lower Band ▓▓▓▓▓▓▓▓▓░░░░░░░ Upper Band
           ↑
    Current Price (23.4%)
```

#### Model Details (Collapsible)
```
📊 Model Details & Statistics  [v]

┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Equation    │ │ R² Accuracy │ │ Width       │
│ y=0.5x+140  │ │ 92.5%       │ │ $12.90      │
│             │ │ ▓▓▓▓▓▓▓▓░░  │ │             │
└─────────────┘ └─────────────┘ └─────────────┘

┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Std. Dev    │ │ Confidence  │ │ Trend       │
│ $6.45       │ │ 95%         │ │ 📈 Upward   │
└─────────────┘ └─────────────┘ └─────────────┘
```

### Watchlist Button

#### Not Added State
```
┌──────────────────────────┐
│  + Add to Watchlist      │  ← Blue gradient
└──────────────────────────┘
```

#### Added State
```
┌──────────────────────────┐
│  ★ Remove from Watchlist │  ← Red gradient
└──────────────────────────┘
```

#### Icon Mode
```
☆  → Hover → ★  (Yellow star)
```

## ✨ Interactive Features

### Hover Effects
- **Cards**: Scale up slightly (scale-105)
- **Buttons**: Scale up + shadow increase
- **Watchlist Icon**: Scale-110 + color change

### Animations
- **Loading State**: 
  - Spinning loader with gradient glow
  - Bouncing dots (staggered)
  - Pulsing AI badge

- **Transitions**: 
  - All: duration-200
  - Smooth scale transforms
  - Color transitions

### Focus States
- Ring offset for accessibility
- Color-coded focus rings
- Clear visual indicators

## 📊 Responsive Breakpoints

```css
/* Mobile First */
Default: Single column, stacked layout

/* md: 768px */
- Grid cols-2 for price cards
- Technical indicators wrap
- Side-by-side charts

/* lg: 1024px */
- Grid cols-4 for price cards
- Hero section horizontal
- Full 2-column layout

/* xl: 1280px */
- Max width: 1800px
- Optimal spacing
- All features visible
```

## 🎭 States & Feedback

### Loading State
```
╔═══════════════════════════════════╗
║                                   ║
║         ⚡ (spinning)              ║
║                                   ║
║   Analyzing AAPL price data...    ║
║   Our AI is crunching numbers     ║
║                                   ║
║         • • •                     ║
║                                   ║
╚═══════════════════════════════════╝
```

### Error State
```
╔═══════════════════════════════════╗
║                                   ║
║           ⚠️                      ║
║     Analysis Error                ║
║                                   ║
║  API rate limit reached...        ║
║                                   ║
║  ⚠️ Could be due to API limits   ║
║      Please try again later       ║
║                                   ║
╚═══════════════════════════════════╝
```

### Success State
```
╔═══════════════════════════════════╗
║  🟢  BUY SIGNAL                   ║
║  Full data with all metrics       ║
║  Interactive features enabled     ║
╚═══════════════════════════════════╝
```

## 🔍 Typography Scale

```
3xl (30px) - Signal Action Text
2xl (24px) - Price Values
xl  (20px) - Component Titles
lg  (18px) - Section Headers
base(16px) - Body Text
sm  (14px) - Descriptions
xs  (12px) - Labels & Meta
[10px]     - Fine Print
```

## 🎪 Shadow System

```css
/* Card Shadows */
shadow-lg:  Standard cards
shadow-xl:  Enhanced cards (LR component)
shadow-md:  Price cards
shadow-sm:  Subtle elements

/* Hover States */
hover:shadow-xl  - Increased depth
hover:shadow-2xl - Maximum depth
```

## 🌈 Gradient Usage

### Backgrounds
```css
/* Page Background */
bg-gradient-to-br from-background via-background to-primary/5

/* AI Badge */
bg-gradient-to-r from-purple-500 to-blue-500

/* Button Gradients */
Add:    from-blue-600 to-blue-700
Remove: from-red-500 to-red-600

/* Price Cards */
Current:   from-slate-50 to-slate-100
Predicted: from-blue-50 to-blue-100
Upper:     from-red-50 to-red-100
Lower:     from-green-50 to-green-100
```

## 📱 Touch Targets

All interactive elements meet WCAG standards:
- Minimum 44x44px touch targets
- Clear active states
- Adequate spacing (gap-2 to gap-6)
- Non-overlapping clickable areas

## 🎨 Dark Mode Support

All colors use dark: variants:
- Proper contrast ratios
- Inverted gradients where needed
- Adjusted opacity for overlays
- Readable text on all backgrounds

## 🚀 Performance Optimizations

- CSS transforms for animations (GPU accelerated)
- Conditional rendering for collapsed sections
- Optimized icon imports from lucide-react
- Proper memoization in components
- Efficient state updates

---

**Design System**: Consistent, accessible, and modern
**User Experience**: Intuitive, informative, and engaging
**Visual Appeal**: Professional, polished, and premium

