import { HugeiconsIcon } from "@hugeicons/react";
import Key01Icon from "@hugeicons/core-free-icons/Key01Icon";
import VaultIcon from "@hugeicons/core-free-icons/VaultIcon";
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon";
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon";
import PlusSignIcon from "@hugeicons/core-free-icons/PlusSignIcon";
import SquareLock01Icon from "@hugeicons/core-free-icons/SquareLock01Icon";
import ShieldKeyIcon from "@hugeicons/core-free-icons/ShieldKeyIcon";
import Logout01Icon from "@hugeicons/core-free-icons/Logout01Icon";
import MoreHorizontalIcon from "@hugeicons/core-free-icons/MoreHorizontalIcon";
import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon";
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon";
import ViewIcon from "@hugeicons/core-free-icons/ViewIcon";
import ViewOffIcon from "@hugeicons/core-free-icons/ViewOffIcon";
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import Edit02Icon from "@hugeicons/core-free-icons/Edit02Icon";
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon";
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon";
import Unlink01Icon from "@hugeicons/core-free-icons/Unlink01Icon";
import Folder01Icon from "@hugeicons/core-free-icons/Folder01Icon";
import Analytics01Icon from "@hugeicons/core-free-icons/Analytics01Icon";
import AiBrain01Icon from "@hugeicons/core-free-icons/AiBrain01Icon";
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon";
import CodeIcon from "@hugeicons/core-free-icons/CodeIcon";
import GithubIcon from "@hugeicons/core-free-icons/GithubIcon";
import StripeIcon from "@hugeicons/core-free-icons/StripeIcon";
import ChatGptIcon from "@hugeicons/core-free-icons/ChatGptIcon";
import UserIcon from "@hugeicons/core-free-icons/UserIcon";
import CreditCardIcon from "@hugeicons/core-free-icons/CreditCardIcon";

// One rounded icon family, with direct imports to avoid the full icon barrel.
const icons = {
  keys: Key01Icon,
  vault: VaultIcon,
  activity: Clock01Icon,
  search: Search01Icon,
  plus: PlusSignIcon,
  lock: SquareLock01Icon,
  shield: ShieldKeyIcon,
  logout: Logout01Icon,
  more: MoreHorizontalIcon,
  copy: Copy01Icon,
  check: Tick02Icon,
  view: ViewIcon,
  hide: ViewOffIcon,
  close: Cancel01Icon,
  edit: Edit02Icon,
  delete: Delete02Icon,
  share: UserGroupIcon,
  unlink: Unlink01Icon,
  folder: Folder01Icon,
  analytics: Analytics01Icon,
  ai: AiBrain01Icon,
  mail: Mail01Icon,
  code: CodeIcon,
  github: GithubIcon,
  stripe: StripeIcon,
  openai: ChatGptIcon,
  user: UserIcon,
  payment: CreditCardIcon,
} as const;

export type GlyphName = keyof typeof icons;

export function Glyph({
  name,
  size = 20,
  className = "",
}: {
  name: GlyphName;
  size?: number;
  className?: string;
}) {
  return (
    <HugeiconsIcon
      icon={icons[name]}
      size={size}
      strokeWidth={1.8}
      className={`ui-icon ${className}`}
      aria-hidden="true"
      focusable="false"
      data-icon={name}
    />
  );
}
