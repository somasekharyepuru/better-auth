import { Button, type ButtonProps } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean
  loadingText?: string
}

export function LoadingButton({
  isLoading,
  loadingText,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={disabled || isLoading} className={className} {...props}>
      {isLoading ? (
        <>
          <Spinner size="sm" />
          {loadingText ?? "Loading..."}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
