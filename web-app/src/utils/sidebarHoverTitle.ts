/** טקסט ריחוף: שם הקומפוננטה + אחריות פיתוח */
export function sidebarHoverTitle(label: string, devResponsibility?: string): string {
  if (!devResponsibility) return label;
  return `${label}\n${devResponsibility}`;
}

export const SIDEBAR_COMPOSITE_DEV_RESPONSIBILITY = {
  pkmb: 'אחריות פיתוח - אג"ם',
  ai: 'אחריות פיתוח - ענף 300',
} as const;
