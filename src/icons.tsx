/**
 * Lucide-style stroke SVG icons (24x24, stroke=currentColor pattern via `color` prop).
 */
import React from 'react';
import Svg, { Path, Circle, Rect, Line, Polyline, Polygon } from 'react-native-svg';

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function base(props: IconProps) {
  return {
    width: props.size ?? 22,
    height: props.size ?? 22,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: props.color ?? 'currentColor',
    strokeWidth: props.strokeWidth ?? 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
}

export const IconPlus = (p: IconProps) => (
  <Svg {...base(p)}><Line x1="12" y1="5" x2="12" y2="19" /><Line x1="5" y1="12" x2="19" y2="12" /></Svg>
);

export const IconPencil = (p: IconProps) => (
  <Svg {...base(p)}><Path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></Svg>
);

export const IconTrash = (p: IconProps) => (
  <Svg {...base(p)}>
    <Path d="M3 6h18" /><Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <Path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <Line x1="10" y1="11" x2="10" y2="17" /><Line x1="14" y1="11" x2="14" y2="17" />
  </Svg>
);

export const IconClock = (p: IconProps) => (
  <Svg {...base(p)}><Circle cx="12" cy="12" r="9" /><Polyline points="12 7 12 12 15.5 14" /></Svg>
);

export const IconCalendar = (p: IconProps) => (
  <Svg {...base(p)}>
    <Rect x="3" y="4" width="18" height="18" rx="3" />
    <Line x1="16" y1="2" x2="16" y2="6" /><Line x1="8" y1="2" x2="8" y2="6" />
    <Line x1="3" y1="10" x2="21" y2="10" />
  </Svg>
);

export const IconShare = (p: IconProps) => (
  <Svg {...base(p)}>
    <Path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
    <Polyline points="16 6 12 2 8 6" /><Line x1="12" y1="2" x2="12" y2="15" />
  </Svg>
);

export const IconSun = (p: IconProps) => (
  <Svg {...base(p)}>
    <Circle cx="12" cy="12" r="4" />
    <Line x1="12" y1="2" x2="12" y2="4" /><Line x1="12" y1="20" x2="12" y2="22" />
    <Line x1="4.9" y1="4.9" x2="6.3" y2="6.3" /><Line x1="17.7" y1="17.7" x2="19.1" y2="19.1" />
    <Line x1="2" y1="12" x2="4" y2="12" /><Line x1="20" y1="12" x2="22" y2="12" />
    <Line x1="4.9" y1="19.1" x2="6.3" y2="17.7" /><Line x1="17.7" y1="6.3" x2="19.1" y2="4.9" />
  </Svg>
);

export const IconMoon = (p: IconProps) => (
  <Svg {...base(p)}><Path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></Svg>
);

export const IconInfo = (p: IconProps) => (
  <Svg {...base(p)}><Circle cx="12" cy="12" r="9" /><Line x1="12" y1="11" x2="12" y2="16" /><Line x1="12" y1="8" x2="12.01" y2="8" /></Svg>
);

export const IconX = (p: IconProps) => (
  <Svg {...base(p)}><Line x1="18" y1="6" x2="6" y2="18" /><Line x1="6" y1="6" x2="18" y2="18" /></Svg>
);

export const IconCheck = (p: IconProps) => (
  <Svg {...base(p)}><Polyline points="20 6 9 17 4 12" /></Svg>
);

export const IconChevronDown = (p: IconProps) => (
  <Svg {...base(p)}><Polyline points="6 9 12 15 18 9" /></Svg>
);

export const IconGrid = (p: IconProps) => (
  <Svg {...base(p)}>
    <Rect x="3" y="3" width="18" height="18" rx="2" />
    <Line x1="3" y1="9" x2="21" y2="9" /><Line x1="3" y1="15" x2="21" y2="15" />
    <Line x1="9" y1="3" x2="9" y2="21" /><Line x1="15" y1="3" x2="15" y2="21" />
  </Svg>
);

export const IconPrinter = (p: IconProps) => (
  <Svg {...base(p)}>
    <Polyline points="6 9 6 2 18 2 18 9" />
    <Path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <Rect x="6" y="14" width="12" height="8" />
  </Svg>
);

export const IconImage = (p: IconProps) => (
  <Svg {...base(p)}>
    <Rect x="3" y="3" width="18" height="18" rx="2" /><Circle cx="9" cy="9" r="2" />
    <Path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
  </Svg>
);

export const IconFileJson = (p: IconProps) => (
  <Svg {...base(p)}>
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
    <Polyline points="14 2 14 8 20 8" />
    <Path d="M9.5 12.5 8 14l1.5 1.5" /><Path d="m14.5 12.5 1.5 1.5-1.5 1.5" />
  </Svg>
);

export const IconLink = (p: IconProps) => (
  <Svg {...base(p)}>
    <Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </Svg>
);

export const IconUpload = (p: IconProps) => (
  <Svg {...base(p)}>
    <Path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
    <Polyline points="8 10 12 6 16 10" /><Line x1="12" y1="6" x2="12" y2="19" />
  </Svg>
);

export const IconDownload = (p: IconProps) => (
  <Svg {...base(p)}>
    <Path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
    <Polyline points="8 13 12 17 16 13" /><Line x1="12" y1="3" x2="12" y2="17" />
  </Svg>
);

export const IconAlert = (p: IconProps) => (
  <Svg {...base(p)}>
    <Path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <Line x1="12" y1="9" x2="12" y2="13" /><Line x1="12" y1="17" x2="12.01" y2="17" />
  </Svg>
);

export const IconLayers = (p: IconProps) => (
  <Svg {...base(p)}>
    <Polygon points="12 2 2 7 12 12 22 7 12 2" />
    <Polyline points="2 17 12 22 22 17" /><Polyline points="2 12 12 17 22 12" />
  </Svg>
);

export const IconBook = (p: IconProps) => (
  <Svg {...base(p)}>
    <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
  </Svg>
);
