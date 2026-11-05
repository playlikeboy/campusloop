import { Field } from "@base-ui/react/field";
import type * as React from "react";

import { fieldClassName } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Rendered through Field.Control so a wrapping FormField links label, hint and error. */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <Field.Control
      render={<textarea />}
      data-slot="textarea"
      className={cn(fieldClassName, "flex field-sizing-content min-h-11 py-2.5 leading-6", className)}
      {...(props as React.ComponentProps<typeof Field.Control>)}
    />
  );
}

export { Textarea };
