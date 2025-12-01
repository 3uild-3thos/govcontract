# Phase Timeline Component

A responsive timeline component that displays proposal lifecycle phases. Shows all phases on desktop, and a 3-node sliding window on mobile/tablet.

## File Structure

```
phase-timeline/
├── index.tsx                   # Main entry point, composes desktop + mobile views
├── desktop-phase-timeline.tsx  # Full horizontal timeline for lg+ screens
├── mobile-phase-timeline.tsx   # 3-node carousel for mobile/tablet
├── mobile-phase-node.tsx       # Mobile node with scaling/emphasis logic
├── phase-node.tsx              # Desktop phase node
├── phase-icon.tsx              # Renders phase icons based on state
├── connector-line.tsx          # Animated connector between nodes
├── created-node.tsx            # "Created" checkmark node (always passed)
├── phase-detail.tsx            # Current phase description text
├── constants.ts                # PHASES config, shared styles
├── types.ts                    # TypeScript definitions
└── utils.ts                    # State resolution, mobile calculations
```

## Core Concepts

### Phase States

Each phase can be in one of 4 states:

| State      | Description      | Visual                         |
| ---------- | ---------------- | ------------------------------ |
| `passed`   | Completed phases | Muted gradient, checkmark icon |
| `current`  | Active phase     | Glowing, animated, phase icon  |
| `upcoming` | Future phases    | Dimmed, border only            |
| `failed`   | Failed phase     | Red glow, X icon               |

### Connector Variants

Lines between nodes have 3 variants:

| Variant    | When Used                               | Visual                      |
| ---------- | --------------------------------------- | --------------------------- |
| `complete` | Between passed phases or passed→current | Solid gradient, can animate |
| `flowing`  | Leading into current phase              | Animated flow effect        |
| `upcoming` | After current phase                     | Dimmed, no animation        |

## Desktop vs Mobile

### Desktop (lg+)

Shows all phases in a horizontal line:

```
[Created] ─── [Support] ─── [Discussion] ─── [Voting] ─── [Finalized]
```

- All phases always visible
- Current phase has glow animation
- Connectors animate based on progress

### Mobile/Tablet (< lg)

Shows a sliding window of 3 nodes centered on current phase:

```
... ─── [Previous] ─── [Current] ─── [Next] ─── ...
```

**Sliding Window Rules:**

| Current Phase  | Visible Nodes                 | Edge Connectors       |
| -------------- | ----------------------------- | --------------------- |
| Support (0)    | Created, Support, Discussion  | Left: No, Right: Yes  |
| Discussion (1) | Support, Discussion, Voting   | Left: Yes, Right: Yes |
| Voting (2)     | Discussion, Voting, Finalized | Left: Yes, Right: No  |
| Finalized (3)  | Discussion, Voting, Finalized | Left: Yes, Right: No  |

**Special Cases:**

- **Finalized**: Current phase shifts to right position (not centered)
- **Failed**: Shows [Created, Support(failed), Discussion]

**Edge Connectors:**

- Left connector: Indicates hidden phases exist before visible window
- Right connector: Indicates hidden phases exist after visible window

## Mobile Node Emphasis

Mobile nodes have dynamic scaling based on position and state:

| Condition                       | Effect                               |
| ------------------------------- | ------------------------------------ |
| Center position + current state | Scaled up (1.05x), full opacity      |
| Center + finalized phase        | Normal size, full opacity (no pulse) |
| Center + failed state           | Normal size, full opacity, red glow  |
| Non-center positions            | Scaled down (0.9x), reduced opacity  |

## Adding/Removing Phases

1. Update `PHASES` array in `constants.ts`:

```typescript
export const PHASES: PhaseDefinition[] = [
  { key: "supporting", label: "Support Phase", icon: "flame" },
  { key: "discussion", label: "Discussion Phase", icon: "discussion" },
  { key: "voting", label: "Voting Active", icon: "voting" },
  // Add new phase here:
  { key: "execution", label: "Execution", icon: "clock" },
  { key: "finalized", label: "Finalized", icon: "clock" },
];
```

2. Add corresponding `PhaseDetail` in `PHASE_DETAILS`

3. Update `ProposalLifecycleStage` type in dummy-data if needed

**Assumptions:**

- Failure always occurs at first phase (index 0)
- Finalized is always the last phase
- Minimum 3 phases required for mobile view

## Adding New Icons

1. Add icon key to `PhaseIconKey` type in `types.ts`:

```typescript
export type PhaseIconKey =
  | "voting"
  | "clock"
  | "flame"
  | "discussion"
  | "newicon";
```

2. Add case in `phase-icon.tsx`:

```typescript
case "newicon":
  return (
    <NewIcon
      className={cn("size-5", iconClassName)}
      strokeWidth={2.5}
      aria-hidden="true"
    />
  );
```

## Shared Styles

Defined in `constants.ts` and used by both desktop and mobile:

```typescript
// Node background/text colors
NODE_STATE_STYLES.passed;
NODE_STATE_STYLES.current;
NODE_STATE_STYLES.currentAnimated;
NODE_STATE_STYLES.upcoming;
NODE_STATE_STYLES.failed;

// Glow ring effects
NODE_GLOW_STYLES.currentPing; // Animated ping for current
NODE_GLOW_STYLES.currentStatic; // Static glow for finalized
NODE_GLOW_STYLES.failed; // Red glow for failed
```

## Key Functions

### `resolvePhaseState(phaseIndex, currentPhaseIndex, proposalStatus)`

Determines a phase's state based on its position relative to current phase.

### `resolveConnectorVariant(leftState, rightState)`

Determines connector style based on adjacent node states.

### `calculateMobileVisibleNodes({ phases, currentPhaseIndex, proposalStatus })`

Returns which 3 nodes to display in mobile sliding window.

### `shouldShowEdgeConnectors(...)`

Determines if left/right edge connectors should show (indicating hidden nodes).

### `getNodeEmphasis({ state, isCenterPosition, isFinalizedPhase, isProposalFinalized })`

Calculates mobile node scaling, opacity, and highlight state.
