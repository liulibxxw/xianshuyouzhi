
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
  titleFont: 'modern' | 'serif' | 'jianghu' | 'bold';
  bodyFont: 'modern' | 'serif' | 'jianghu' | 'bold';
  layoutStyle: 'centered' | 'split' | 'minimal' | 'duality';
  mode: 'cover' | 'long-text';
  bodyTextSize: string;
  bodyTextAlign: string;
  isBodyBold: boolean;
  isBodyItalic: boolean;
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
  structure?: 'multi-align-row'; // 新增：结构化布局标识
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

export type FontStyle = CoverState['titleFont'];
export type LayoutStyle = CoverState['layoutStyle'];
export type EditorTab = 'style' | 'drafts' | 'content' | 'export' | 'presets' | 'search';
