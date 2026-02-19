

export interface CoverState {
  title: string;
  subtitle: string;
  bodyText: string;
  secondaryBodyText: string;
  category: string;
  author: string;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  layoutStyle: 'minimal' | 'storybook';
  mode: 'cover' | 'long-text' | 'xhs-cover';
  bodyTextSize: string;
  bodyTextAlign: string;
  isBodyBold: boolean;
  isBodyItalic: boolean;
  titleFont: string;
  bodyFont: string;
}

export interface ContentPreset {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  bodyText: string;
  secondaryBodyText?: string;
  category: string;
  author: string;
}

export interface FormattingStyles {
  color?: string;
  fontSize?: number;
  isBold?: boolean;
  isItalic?: boolean;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
}

export interface TransformationRule {
  id: string;
  name: string;
  pattern: string;
  formatting: FormattingStyles;
  scope: 'match' | 'paragraph';
  structure?: 'multi-align-row';
  separator?: string; // 分割符号
  isActive: boolean;
}

export interface AdvancedPreset {
  id: string;
  name: string;
  includeStyle: boolean;
  includeContent: boolean;
  coverState: Partial<CoverState>;
  rules: TransformationRule[];
}

export type LayoutStyle = CoverState['layoutStyle'];
export type CoverMode = CoverState['mode'];
export type EditorTab = 'style' | 'drafts' | 'content' | 'export' | 'presets' | 'search' | 'mode';