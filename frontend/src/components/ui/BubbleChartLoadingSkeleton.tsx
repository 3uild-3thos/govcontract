"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { BubbleVote } from "@/hooks";

const gradientMap: Record<BubbleVote["type"], string> = {
  yes: "grad-yes",
  no: "grad-no",
  abstain: "grad-abstain",
  undecided: "grad-undecided",
};

const borderColorMap: Record<BubbleVote["type"], string> = {
  yes: "#22AA00",
  no: "#AA0000",
  abstain: "#252525",
  undecided: "#252525",
};

const MAX_WIDTH = 400;

const loadingVotes: BubbleVote[] = [
  { voteIdentity: "address0", type: "yes", value: 300, image: null },
  { voteIdentity: "address1", type: "yes", value: 200, image: null },
  { voteIdentity: "address2", type: "yes", value: 100, image: null },
  { voteIdentity: "address3", type: "yes", value: 90, image: null },
  { voteIdentity: "address4", type: "yes", value: 20, image: null },
  { voteIdentity: "address5", type: "yes", value: 20, image: null },
  { voteIdentity: "address6", type: "yes", value: 20, image: null },
  { voteIdentity: "address7", type: "yes", value: 20, image: null },
  { voteIdentity: "address8", type: "yes", value: 20, image: null },
  { voteIdentity: "address0", type: "no", value: 500, image: null },
  { voteIdentity: "address1", type: "no", value: 200, image: null },
  { voteIdentity: "address11", type: "no", value: 100, image: null },
  { voteIdentity: "address12", type: "no", value: 10, image: null },
  { voteIdentity: "address13", type: "no", value: 10, image: null },
  { voteIdentity: "address14", type: "no", value: 10, image: null },
  { voteIdentity: "address15", type: "no", value: 10, image: null },
  { voteIdentity: "address16", type: "no", value: 10, image: null },
  { voteIdentity: "address17", type: "no", value: 10, image: null },
  { voteIdentity: "address0", type: "abstain", value: 100, image: null },
  { voteIdentity: "address1", type: "abstain", value: 1000, image: null },
  { voteIdentity: "address20", type: "abstain", value: 10, image: null },
  { voteIdentity: "address21", type: "abstain", value: 10, image: null },
  { voteIdentity: "address22", type: "abstain", value: 10, image: null },
  { voteIdentity: "address0", type: "undecided", value: 150, image: null },
  { voteIdentity: "address1", type: "undecided", value: 20, image: null },
  { voteIdentity: "address25", type: "undecided", value: 20, image: null },
  { voteIdentity: "address26", type: "undecided", value: 20, image: null },
  { voteIdentity: "address27", type: "undecided", value: 20, image: null },
];

export const BubbleChartLoadingSkeleton = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [nodes, setNodes] = useState<BubbleVote[]>([]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width) {
          setWidth(Math.min(entry.contentRect.width, MAX_WIDTH));
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (width === 0) return;

    const WIDTH = width;
    const HEIGHT = width;
    const CENTER_X = width / 2;
    const CENTER_Y = HEIGHT / 2;
    const RADIUS = width / 2;

    const clusterCenters: Record<BubbleVote["type"], [number, number]> = {
      yes: [CENTER_X - 50, CENTER_Y - 50],
      no: [CENTER_X + 50, CENTER_Y - 50],
      abstain: [CENTER_X - 50, CENTER_Y + 50],
      undecided: [CENTER_X + 50, CENTER_Y + 50],
    };

    // console.log("width:", width);
    // for smaller screen widths (below 400px), this should adjust accordingly
    const responsiveScalingFactor = 1;

    // Initialize nodes with radius
    const initialNodes = loadingVotes.map((v) => ({
      ...v,
      r: (Math.sqrt(v.value) * 2 + 10) * responsiveScalingFactor,
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
    }));

    const simulation = d3
      .forceSimulation(initialNodes as d3.SimulationNodeDatum[])
      .force(
        "collide",
        d3
          .forceCollide<BubbleVote>()
          .radius((d) => d.r! + 5)
          .strength(1)
      )
      .force(
        "x",
        d3
          .forceX<BubbleVote>((d) => clusterCenters[d.type][0])
          .strength((d) => (d.r ?? 10) / 100) // bigger radius = stronger pull
      )
      .force(
        "y",
        d3
          .forceY<BubbleVote>((d) => clusterCenters[d.type][1])
          .strength((d) => (d.r ?? 10) / 100)
      )
      .force("boundingCircle", () => {
        for (const node of initialNodes) {
          const dx = node.x! - CENTER_X;
          const dy = node.y! - CENTER_Y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = RADIUS - node.r! - 10; // 10 so it doesn't touch the limit
          if (dist > maxDist) {
            const angle = Math.atan2(dy, dx);
            node.x = CENTER_X + Math.cos(angle) * maxDist;
            node.y = CENTER_Y + Math.sin(angle) * maxDist;
          }
        }
      })
      .stop();

    // Run simulation manually for stability
    for (let i = 0; i < 300; ++i) simulation.tick();

    setNodes([...initialNodes]);
  }, [width]);

  const WIDTH = width;
  const HEIGHT = width;
  const CENTER_X = width / 2;
  const CENTER_Y = HEIGHT / 2;
  const RADIUS = width / 2;

  return (
    <div
      ref={containerRef}
      className="w-full h-auto flex justify-center items-center animate-pulse"
    >
      <svg
        width={WIDTH}
        height={HEIGHT}
        className="max-md:w-full flex items-center justify-center"
      >
        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={RADIUS}
          fill="none"
          stroke="#252525"
        />
        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={RADIUS * 0.6}
          fill="none"
          stroke="#252525"
        />
        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={RADIUS * 0.25}
          fill="none"
          stroke="#252525"
        />
        {nodes.map((node, i) => (
          <g key={i}>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.r}
              fill={`url(#${gradientMap[node.type]})`}
              stroke={borderColorMap[node.type]}
              strokeWidth={1}
              opacity={0.5}
            >
              <title>
                {node.type}: {node.value}
              </title>
            </circle>
          </g>
        ))}

        <defs>
          <linearGradient id="grad-yes" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22AA00" />
            <stop offset="100%" stopColor="#125800" />
          </linearGradient>
          <linearGradient id="grad-no" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#AA0000" />
            <stop offset="100%" stopColor="#580000" />
          </linearGradient>
          <linearGradient id="grad-abstain" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E5A152" />
            <stop offset="100%" stopColor="#B67120" />
          </linearGradient>
          <linearGradient id="grad-undecided" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4A4A4A" />
            <stop offset="100%" stopColor="#232323" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
