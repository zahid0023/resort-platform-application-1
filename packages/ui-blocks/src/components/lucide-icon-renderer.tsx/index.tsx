import { forwardRef } from "react";
import { FolderIcon, icons as LucideIcons, type LucideProps } from "lucide-react";

export interface LucideIconProps extends Omit<LucideProps, "ref"> {
    /** Lucide icon name in PascalCase (e.g. "Waves", "Home"). */
    name?: string;
    /** Fallback icon name if `name` is missing or unknown. Defaults to FolderIcon. */
    fallbackName?: string;
}

/**
 * Renders a Lucide icon by name. Forwards all standard Lucide/SVG props
 * (size, color, strokeWidth, className, ...). Falls back to FolderIcon when
 * the requested icon does not exist.
 */
export const LucideIconRenderer = forwardRef<SVGSVGElement, LucideIconProps>(
    ({ name, fallbackName, ...props }, ref) => {
        const registry = LucideIcons as Record<string, React.ComponentType<LucideProps>>;
        const Resolved =
            (name && registry[name]) ||
            (fallbackName && registry[fallbackName]) ||
            FolderIcon;
        return <Resolved ref={ref} {...props} />;
    },
);
LucideIconRenderer.displayName = "LucideIconRenderer";

export default LucideIconRenderer;