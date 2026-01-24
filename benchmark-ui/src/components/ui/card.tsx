import React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement> & {
  as?: keyof JSX.IntrinsicElements;
};

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-[10px] border border-[rgba(0,0,0,0.06)] bg-white p-6 ${className}`}
      {...props}
    />
  );
}

export function CardTitle({ className = "", as: Component = "h3", ...props }: CardTitleProps) {
  return (
    <Component className={`text-lg font-semibold text-[#1e293b] ${className}`} {...props} />
  );
}

export function CardDescription({ className = "", ...props }: CardProps) {
  return (
    <p className={`text-sm text-[#64748b] ${className}`} {...props} />
  );
}
