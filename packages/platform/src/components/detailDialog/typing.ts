export interface LabelOption {
  value: string;
  name: string;
  slot?: boolean;
  label?: string;
  optional?: boolean;
}
export interface ConstantOption {
  title?: string;
  constant?: any;
}
export interface Label {
  [key: string]: any;
}
