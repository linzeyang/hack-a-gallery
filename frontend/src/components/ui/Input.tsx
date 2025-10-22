import React from "react";

export interface InputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>,
    "size"
  > {
  label?: string;
  error?: string;
  helpText?: string;
  inputType?: "text" | "textarea" | "date" | "url" | "email" | "number";
  rows?: number;
}

export const Input = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  InputProps
>(
  (
    {
      label,
      error,
      helpText,
      inputType = "text",
      className = "",
      rows = 4,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const baseStyles =
      "w-full px-4 py-2 border rounded-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 min-h-[44px] text-base";
    const normalStyles =
      "border-gray-300 focus:border-blue-500 focus:ring-blue-500";
    const errorStyles =
      "border-red-500 focus:border-red-500 focus:ring-red-500";

    const combinedClassName = `${baseStyles} ${
      error ? errorStyles : normalStyles
    } ${className}`;

    const describedBy =
      [
        error ? `${inputId}-error` : undefined,
        helpText ? `${inputId}-help` : undefined,
      ]
        .filter(Boolean)
        .join(" ") || undefined;

    const sharedProps = {
      id: inputId,
      className: combinedClassName,
      "aria-invalid": error ? "true" : "false",
      "aria-describedby": describedBy,
      ...props,
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}

        {inputType === "textarea" ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            rows={rows}
            {...(sharedProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            type={inputType}
            {...(sharedProps as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )}

        {helpText && !error && (
          <p id={`${inputId}-help`} className="mt-1 text-sm text-gray-600">
            {helpText}
          </p>
        )}

        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
