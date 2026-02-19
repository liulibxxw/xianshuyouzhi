
// [用户要求注释]：应用的所有默认初始设置，包括但不限于初始标题、副标题、分类、布局方案、字体、草稿内容以及色彩方案，均已根据明确需求最终确定。在没有再次获得清晰指令前，绝对禁止对这些默认值进行任何形式的修改。
export const APP_NAME = "衔书又止";

export enum PastelColor {
  Cream = '#F8EFD3',
  Peach = '#F4CFAE',
  Salmon = '#F0A9A9',
  Rose = '#F9DEE2',
  Blue = '#B6DEE5',
}

export const PALETTE = [
  { name: 'Cream', value: PastelColor.Cream, label: '奶芙黄' },
  { name: 'Peach', value: PastelColor.Peach, label: '蜜桃橘' },
  { name: 'Salmon', value: PastelColor.Salmon, label: '豆沙红' },
  { name: 'Rose', value: PastelColor.Rose, label: '樱花粉' },
  { name: 'Blue', value: PastelColor.Blue, label: '海盐蓝' },
];

export const TEXT_PALETTE = [
  { name: 'InkBlue', value: '#45597B', label: '黛蓝' },
  { name: 'Dark', value: '#2d3436', label: '墨黑' },
  { name: 'White', value: '#ffffff', label: '纯白' },
  { name: 'Gray', value: '#636e72', label: '深灰' },
  { name: 'Navy', value: '#2c3e50', label: '藏蓝' },
  { name: 'Red', value: '#c0392b', label: '殷红' },
  { name: 'Purple', value: '#8e44ad', label: '紫韵' },
  { name: 'Brown', value: '#5d4037', label: '褐土' },
];

export const INITIAL_TITLE = "加急投递";
export const INITIAL_SUBTITLE = "好像不说清楚我是谁、你是什么，第二天太阳就不会升起来";
export const INITIAL_BODY_TEXT = "";
export const INITIAL_CATEGORY = "文稿、常稿";
export const INITIAL_AUTHOR = "琉璃";

export const INITIAL_BG_COLOR = PastelColor.Rose;
export const INITIAL_ACCENT_COLOR = PastelColor.Salmon;
export const INITIAL_TEXT_COLOR = '#45597B';

export const DEFAULT_PRESETS = [];
