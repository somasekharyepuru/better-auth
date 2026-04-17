"use client"

import React, { Component, ReactNode } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
    children: ReactNode
    fallback?: ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

/**
 * React Error Boundary component to catch and handle runtime errors.
 * Prevents the entire page from crashing when a component throws an error.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console in development
        console.error("Error Boundary caught an error:", error, errorInfo)

        // TODO: Send to error tracking service (e.g., Sentry)
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="min-h-[200px] flex items-center justify-center p-6">
                    <Alert variant="destructive" className="max-w-md">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Something went wrong</AlertTitle>
                        <AlertDescription className="mt-2">
                            <p className="mb-4">
                                An unexpected error occurred. Please try again.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={this.handleRetry}
                                className="gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Try again
                            </Button>
                        </AlertDescription>
                    </Alert>
                </div>
            )
        }

        return this.props.children
    }
}
