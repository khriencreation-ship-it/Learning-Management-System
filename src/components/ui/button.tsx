import * as React from "react"
import { Loader2 } from "lucide-react"

// Simple utility to merge class names
function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ")
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
    asChild?: boolean
    loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", asChild = false, loading, children, ...props }, ref) => {

        // Base styles
        const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

        // Variant styles
        const variants = {
            default: "bg-primary text-primary-foreground hover:bg-primary/90 text-white", // Added text-white for safety if primary-foreground isn't defined
            destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            ghost: "hover:bg-accent hover:text-accent-foreground",
            link: "text-primary underline-offset-4 hover:underline",
        }

        // Size styles
        const sizes = {
            default: "h-10 px-4 py-2",
            sm: "h-9 rounded-md px-3",
            lg: "h-11 rounded-md px-8",
            icon: "h-10 w-10",
        }

        const Comp = "button"

        return (
            <Comp
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                ref={ref}
                disabled={props.disabled || loading}
                {...props}
            >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </Comp>
        )
    }
)
Button.displayName = "Button"

export { Button }
