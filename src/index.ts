// Youtopia Design System — public entry point.
// Importing this once pulls in tokens + component styles as a side effect.
import "./styles.css";
import "./styles.ext.css";

export { Button } from "./components/Button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./components/Button";

export { Input } from "./components/Input";
export type { InputProps } from "./components/Input";

export { Select } from "./components/Select";
export type { SelectProps } from "./components/Select";

export { Checkbox } from "./components/Checkbox";
export type { CheckboxProps } from "./components/Checkbox";

export { Switch } from "./components/Switch";
export type { SwitchProps } from "./components/Switch";

export { Badge } from "./components/Badge";
export type { BadgeProps, BadgeTone } from "./components/Badge";

export { Alert } from "./components/Alert";
export type { AlertProps, AlertTone } from "./components/Alert";

export { Card } from "./components/Card";
export type { CardProps } from "./components/Card";

export { Tabs } from "./components/Tabs";
export type { TabsProps, TabItem } from "./components/Tabs";

export { DataTable } from "./components/DataTable";
export type { DataTableProps, Column } from "./components/DataTable";

export { Progress } from "./components/Progress";
export type { ProgressProps } from "./components/Progress";

export { Avatar, AvatarGroup } from "./components/Avatar";
export type { AvatarProps, AvatarGroupProps } from "./components/Avatar";

// --- Forms & primitives ---
export { Textarea } from "./components/Textarea";
export type { TextareaProps } from "./components/Textarea";

export { RadioGroup } from "./components/RadioGroup";
export type { RadioGroupProps, RadioOption } from "./components/RadioGroup";

export { Divider } from "./components/Divider";
export type { DividerProps } from "./components/Divider";

export { Tag } from "./components/Tag";
export type { TagProps } from "./components/Tag";

export { Spinner } from "./components/Spinner";
export type { SpinnerProps } from "./components/Spinner";

export { Skeleton } from "./components/Skeleton";
export type { SkeletonProps } from "./components/Skeleton";

// --- Messaging & feedback ---
export { Banner } from "./components/Banner";
export type { BannerProps, BannerTone } from "./components/Banner";

export { EmptyState } from "./components/EmptyState";
export type { EmptyStateProps } from "./components/EmptyState";

export { Tooltip } from "./components/Tooltip";
export type { TooltipProps } from "./components/Tooltip";

export { Modal } from "./components/Modal";
export type { ModalProps } from "./components/Modal";

export { DropdownMenu } from "./components/DropdownMenu";
export type { DropdownMenuProps, MenuAction } from "./components/DropdownMenu";

export { ToastProvider, useToast } from "./components/Toast";
export type { ToastOptions, ToastTone } from "./components/Toast";

// --- Navigation & structure ---
export { Accordion } from "./components/Accordion";
export type { AccordionProps, AccordionItem } from "./components/Accordion";

export { Breadcrumb } from "./components/Breadcrumb";
export type { BreadcrumbProps, Crumb } from "./components/Breadcrumb";

export { Pagination } from "./components/Pagination";
export type { PaginationProps } from "./components/Pagination";

export { SegmentedControl } from "./components/SegmentedControl";
export type { SegmentedControlProps, Segment } from "./components/SegmentedControl";

// --- Finance-forward ---
export { StatCard } from "./components/StatCard";
export type { StatCardProps } from "./components/StatCard";

export { Sparkline } from "./components/Sparkline";
export type { SparklineProps } from "./components/Sparkline";

export { Money } from "./components/Money";
export type { MoneyProps } from "./components/Money";

export { Icon } from "./components/Icon";
export type { IconProps, IconName } from "./components/Icon";
