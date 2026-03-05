# UI/UX Design Document

## 1. Design Overview

### 1.1 Purpose

This document defines the user interface and user experience design for the Smart Streetlight Automation and Predictive Maintenance System. The system enables real-time monitoring, fault detection, and predictive maintenance of four streetlight nodes using IoT and Machine Learning.

## 2. User Roles

The system supports four primary user roles:

| Role           | Description                                             |
| :------------- | :------------------------------------------------------ |
| **Admin**      | Full access including user management and analytics     |
| **Operator**   | Real-time monitoring and remote control of streetlights |
| **Technician** | Maintenance alerts, fault diagnosis, repair logs        |
| **Viewer**     | Read-only dashboard access                              |

## 3. Design Principles

### 3.1 Simplicity

Clear, minimal dashboard with real-time insights.

### 3.2 Visibility

Color-coded node states for instant recognition.

### 3.3 Responsiveness

Optimized for:

- Desktop (primary use)
- Tablet
- Mobile (monitoring only)

### 3.4 Data Clarity

Charts must be:

- Clean
- Interpretable
- ML result focused

## 4. Information Architecture

### 4.1 Main Navigation Structure

- **Dashboard**
  - Node Monitoring
  - Predictive Analytics
  - Maintenance
  - Reports
  - User Management (Admin Only)
  - Settings

## 5. Core Screens

### 5.1 Login Page

**Purpose:** Secure system access.

**Components:**

- Email field
- Password field
- Role-based redirect
- "Forgot Password"

**UX Notes:**

- Clean white background
- Centered login card
- Minimal distraction

### 5.2 Dashboard (Main Overview)

**Purpose:** Quick system health overview.

#### Layout Concept:

- **System Summary Cards:** | Total Nodes | Active | Faulty | Maintenance |
- **Node Status Grid:** 4 Node Status Grid (Node 1 | Node 2 | Node 3 | Node 4)

**Node Card Example:**

- **Node 1**
- **Status:** 🟢 Normal
- **Voltage:** 11.9V
- **Current:** 0.45A
- **Light Level:** 820 lux
- **Prediction:** Healthy

**Color Coding:**
| Status | Color |
| :--- | :--- |
| Normal | 🟢 Green |
| Short Circuit | 🔴 Red |
| Bulb Fault | 🟠 Orange |
| Needs Maintenance | 🟡 Yellow |

### 5.3 Node Monitoring Page

**Purpose:** Detailed node-level inspection.

**Features:**

- Real-time charts:
  - Voltage vs Time
  - Current vs Time
  - Power vs Time
  - LDR readings
- Relay status (ON/OFF toggle for Operator/Admin)

**Graph Components:**

- Line charts
- Zoomable timeline
- Live updating every 3–5 seconds

### 5.4 Predictive Analytics Page

**Purpose:** Display ML output.

**Sections:**

1. **Fault Classification**
   - Model prediction result
   - Confidence percentage
2. **Maintenance Probability**
   - Remaining Useful Life (RUL)
   - Degradation trend chart
3. **Feature Importance**
   - Voltage contribution
   - Current deviation
   - Operating hours

### 5.5 Maintenance Page (Technician-Focused)

**Purpose:** Actionable repair workflow.

**Table Layout:**
| Node | Fault Type | Priority | Date Detected | Action |
| :--- | :--- | :--- | :--- | :--- |
| Node 1 | Short Circuit | High | 2023-10-27 | Inspect Relay |

**Interactions:**
Clicking a row opens:

- Sensor history
- Fault explanation
- Suggested action
- Repair log input form

### 5.6 Reports Page

**Export Options:**

- CSV
- PDF

**Metrics:**

- Energy consumption
- Fault frequency
- Maintenance trends
- Uptime percentage

## 6. User Experience Flow

### 6.1 Operator Flow

`Login -> Dashboard -> Node Monitoring -> Toggle Relay (if needed)`

### 6.2 Technician Flow

`Login -> Maintenance Page -> View Alert -> Inspect Node -> Log Repair`

### 6.3 Admin Flow

`Login -> Dashboard -> Reports -> Manage Users`

## 7. UI Components

### 7.1 Cards

Used for:

- Node status
- Summary metrics
- Alerts

### 7.2 Charts

Used for:

- Time-series sensor data
- ML prediction trend

### 7.3 Alerts

**Notification types:**

- Real-time toast notification
- Persistent fault banner
- Email (optional future)

## 8. Visual Design Guidelines

### 8.1 Color Palette

| Element    | Color      |
| :--------- | :--------- |
| Primary    | Blue       |
| Normal     | Green      |
| Warning    | Yellow     |
| Critical   | Red        |
| Background | Light Gray |

### 8.2 Typography

- **Header:** Bold
- **Data values:** Semi-bold
- **Labels:** Regular

### 8.3 Icons

- **Light bulb icon:** Node status
- **Wrench icon:** Maintenance
- **Warning triangle:** Fault

## 9. Accessibility Considerations

- Color-blind friendly palette
- High contrast text
- Clear labels (not color-only indicators)

## 10. Responsiveness

- **Desktop:** Full dashboard layout.
- **Tablet:** 2-column grid.
- **Mobile:** Single-column stacked cards.

## 11. Error Handling UX

| Error          | UI Response                   |
| :------------- | :---------------------------- |
| Node offline   | Gray card + "Offline"         |
| API error      | Toast notification            |
| ML unavailable | Show "Prediction unavailable" |

## 12. Future UX Enhancements

- Real-time map visualization
- Dark mode
- Dimming control slider
- Push notifications
- Mobile app version

## 13. Wireframe (Text Visualization)

### Dashboard Layout

```
+-----------------------------------------------------------+
| Smart Streetlight System                                  |
+-----------------------------------------------------------+
| Total Nodes: 4 | Faulty: 1 | Maintenance: 1 |             |
+-----------------------------------------------------------+
| [ Node 1 ] | [ Node 2 ] | [ Node 3 ] | [ Node 4 ]         |
|   Green    |    Red     |   Orange   |   Yellow           |
+-----------------------------------------------------------+
```

## 14. UX Goals for Research Contribution

This UI is designed to:

- Reduce fault detection time
- Improve maintenance response
- Improve data visibility
- Support ML interpretability
- Demonstrate real-world smart city usability
