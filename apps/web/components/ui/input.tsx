import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={`w-full rounded-card border border-navy-100 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-400 focus:border-teal-400 dark:border-navy-700 dark:bg-navy-900 dark:text-white ${className}`}
        {...rest}
      />
    );
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className = "", ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={`w-full rounded-card border border-navy-100 bg-white px-3 py-2 font-mono text-sm text-navy-900 placeholder:text-navy-400 focus:border-teal-400 dark:border-navy-700 dark:bg-navy-900 dark:text-white ${className}`}
      {...rest}
    />
  );
});
