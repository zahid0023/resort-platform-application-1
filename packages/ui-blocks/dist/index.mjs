import * as React4 from 'react';
import { useState, useRef, useEffect } from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown, RotateCcw, Smartphone, Tablet, Monitor } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { jsx, jsxs } from 'react/jsx-runtime';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import * as SeparatorPrimitive from '@radix-ui/react-separator';

// src/components/ui/accordion.tsx
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
var Accordion = AccordionPrimitive.Root;
var AccordionItem = React4.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(AccordionPrimitive.Item, { ref, className: cn("border-b", className), ...props }));
AccordionItem.displayName = "AccordionItem";
var AccordionTrigger = React4.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsx(AccordionPrimitive.Header, { className: "flex", children: /* @__PURE__ */ jsxs(
  AccordionPrimitive.Trigger,
  {
    ref,
    className: cn(
      "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4 shrink-0 transition-transform duration-200" })
    ]
  }
) }));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;
var AccordionContent = React4.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsx(
  AccordionPrimitive.Content,
  {
    ref,
    className: "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
    ...props,
    children: /* @__PURE__ */ jsx("div", { className: cn("pb-4 pt-0", className), children })
  }
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;
var Avatar = React4.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AvatarPrimitive.Root,
  {
    ref,
    className: cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className),
    ...props
  }
));
Avatar.displayName = AvatarPrimitive.Root.displayName;
var AvatarImage = React4.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AvatarPrimitive.Image,
  {
    ref,
    className: cn("aspect-square h-full w-full", className),
    ...props
  }
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;
var AvatarFallback = React4.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AvatarPrimitive.Fallback,
  {
    ref,
    className: cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className),
    ...props
  }
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;
var badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({ className, variant, ...props }) {
  return /* @__PURE__ */ jsx("div", { className: cn(badgeVariants({ variant }), className), ...props });
}
var buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
var Button = React4.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsx(
      Comp,
      {
        className: cn(buttonVariants({ variant, size, className })),
        ref,
        ...props
      }
    );
  }
);
Button.displayName = "Button";
var Card = React4.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      className: cn("rounded-lg border bg-card text-card-foreground shadow-sm", className),
      ...props
    }
  )
);
Card.displayName = "Card";
var CardHeader = React4.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("flex flex-col space-y-1.5 p-6", className), ...props })
);
CardHeader.displayName = "CardHeader";
var CardTitle = React4.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "h3",
    {
      ref,
      className: cn("text-2xl font-semibold leading-none tracking-tight", className),
      ...props
    }
  )
);
CardTitle.displayName = "CardTitle";
var CardDescription = React4.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("p", { ref, className: cn("text-sm text-muted-foreground", className), ...props })
);
CardDescription.displayName = "CardDescription";
var CardContent = React4.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("p-6 pt-0", className), ...props })
);
CardContent.displayName = "CardContent";
var CardFooter = React4.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("flex items-center p-6 pt-0", className), ...props })
);
CardFooter.displayName = "CardFooter";
var Input = React4.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "input",
      {
        type,
        className: cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Input.displayName = "Input";
var Label = React4.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "label",
  {
    ref,
    className: cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    ),
    ...props
  }
));
Label.displayName = "Label";
var Separator = React4.forwardRef(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => /* @__PURE__ */ jsx(
  SeparatorPrimitive.Root,
  {
    ref,
    decorative,
    orientation,
    className: cn(
      "shrink-0 bg-border",
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
      className
    ),
    ...props
  }
));
Separator.displayName = SeparatorPrimitive.Root.displayName;

// src/hero/hero1/default.json
var default_default = {
  title: "Welcome to Our Resort",
  subtitle: "Experience luxury and comfort at its finest.",
  buttonText: "Book Now",
  buttonVariant: "default"
};
var Hero1 = ({
  title = default_default.title,
  subtitle = default_default.subtitle,
  buttonText = default_default.buttonText,
  buttonVariant = default_default.buttonVariant
}) => {
  return /* @__PURE__ */ jsxs(Card, { className: "bg-transparent flex justify-center items-center flex-col w-full h-full text-center shadow-none border-0", children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsx(CardTitle, { children: title }),
      /* @__PURE__ */ jsx(CardDescription, { children: subtitle })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(Button, { variant: buttonVariant, children: buttonText }) })
  ] });
};
var hero1_default = Hero1;

// src/hero/hero4/default.json
var default_default2 = {
  badge: "New",
  title: "Discover Paradise",
  description: "Unwind in our world-class resort and create memories that last a lifetime.",
  primaryButtonText: "Explore Now",
  secondaryButtonText: "Learn More",
  backgroundColor: "#ffffff"
};
var Hero4 = ({
  badge = default_default2.badge,
  title = default_default2.title,
  description = default_default2.description,
  primaryButtonText = default_default2.primaryButtonText,
  secondaryButtonText = default_default2.secondaryButtonText,
  backgroundColor = default_default2.backgroundColor
}) => {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn("flex flex-col w-full h-full justify-center items-center gap-6 py-12 text-center"),
      style: { backgroundColor },
      children: [
        badge && /* @__PURE__ */ jsx(Badge, { variant: "secondary", children: badge }),
        /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold tracking-tight", children: title }),
        /* @__PURE__ */ jsx("p", { className: "max-w-xl text-muted-foreground", children: description }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsx(Button, { children: primaryButtonText }),
          /* @__PURE__ */ jsx(Button, { variant: "outline", children: secondaryButtonText })
        ] })
      ]
    }
  );
};
var hero4_default = Hero4;

// src/hero/hero1/schema.json
var schema_default = {
  key: "hero1",
  name: "Hero 1",
  description: "A card-style hero with a title, subtitle, and call-to-action button.",
  category: "hero",
  pageType: "landing",
  allowedPages: ["landing"],
  props: [
    {
      name: "title",
      type: "string",
      label: "Title"
    },
    {
      name: "subtitle",
      type: "string",
      label: "Subtitle"
    },
    {
      name: "buttonText",
      type: "string",
      label: "Button Text"
    },
    {
      name: "buttonVariant",
      type: "select",
      label: "Button Variant",
      options: [
        "default",
        "outline",
        "secondary",
        "ghost"
      ]
    }
  ]
};

// src/hero/hero4/schema.json
var schema_default2 = {
  key: "hero4",
  name: "Hero 4",
  description: "A centered full-width hero with a badge, headline, description, and two action buttons.",
  category: "hero",
  pageType: "landing",
  allowedPages: ["landing"],
  props: [
    {
      name: "badge",
      type: "string",
      label: "Badge Text"
    },
    {
      name: "title",
      type: "string",
      label: "Title"
    },
    {
      name: "description",
      type: "string",
      label: "Description"
    },
    {
      name: "primaryButtonText",
      type: "string",
      label: "Primary Button Text"
    },
    {
      name: "secondaryButtonText",
      type: "string",
      label: "Secondary Button Text"
    },
    {
      name: "backgroundColor",
      type: "color",
      label: "Background Color"
    }
  ]
};

// src/registry/enums.ts
var UI_BLOCK_CATEGORY_KEYS = [
  "hero"
  // add new ui_block_category.key values here
];
var PAGE_TYPE_KEYS = [
  "landing"
  // add new page_type.key values here
];

// src/registry/index.tsx
var UI_BLOCKS_INDEX = [
  {
    key: schema_default.key,
    name: schema_default.name,
    description: schema_default.description,
    category: schema_default.category,
    component: hero1_default,
    schema: schema_default,
    defaults: default_default
  },
  {
    key: schema_default2.key,
    name: schema_default2.name,
    description: schema_default2.description,
    category: schema_default2.category,
    component: hero4_default,
    schema: schema_default2,
    defaults: default_default2
  }
];
var UI_BLOCK_CATEGORIES = [
  ...new Set(UI_BLOCKS_INDEX.map((uiBlock) => uiBlock.category))
];
function UIBlockRenderer({ uiBlockKey, props, className }) {
  const uiBlock = UI_BLOCKS_INDEX.find((b) => b.key === uiBlockKey);
  if (!uiBlock) return null;
  const UIBlock = uiBlock.component;
  return /* @__PURE__ */ jsx("div", { className, children: /* @__PURE__ */ jsx(UIBlock, { ...uiBlock.defaults, ...props }) });
}
function UIBlockGallery({ uiBlocks = UI_BLOCKS_INDEX, onPreview }) {
  return /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-6", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 hover:cursor-pointer", children: uiBlocks.map((uiBlock) => {
    const UIBlock = uiBlock.component;
    return /* @__PURE__ */ jsx(
      "div",
      {
        onClick: () => onPreview?.(uiBlock),
        className: "h-48 overflow-hidden rounded-xl border bg-card ring-1 ring-foreground/10 transition-all hover:ring-2 hover:ring-primary p-2",
        children: /* @__PURE__ */ jsx("div", { className: "pointer-events-none w-full origin-top scale-90 p-3", children: /* @__PURE__ */ jsx(UIBlock, { ...uiBlock.defaults }) })
      },
      uiBlock.key
    );
  }) }) });
}
var VIEWPORTS = [
  { key: "mobile", label: "Mobile", width: "375px", icon: /* @__PURE__ */ jsx(Smartphone, { className: "h-4 w-4" }) },
  { key: "tablet", label: "Tablet", width: "768px", icon: /* @__PURE__ */ jsx(Tablet, { className: "h-4 w-4" }) },
  { key: "laptop", label: "Laptop", width: "100%", icon: /* @__PURE__ */ jsx(Monitor, { className: "h-4 w-4" }) }
];
function PropField({
  prop,
  value,
  onChange
}) {
  const id = `prop-${prop.name}`;
  if (prop.type === "boolean") {
    return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          id,
          type: "checkbox",
          checked: Boolean(value),
          onChange: (e) => onChange(prop.name, e.target.checked),
          className: "h-4 w-4 rounded border-input accent-primary"
        }
      ),
      /* @__PURE__ */ jsx(Label, { htmlFor: id, children: prop.label })
    ] });
  }
  if (prop.type === "select") {
    return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1.5", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: id, children: prop.label }),
      /* @__PURE__ */ jsx(
        "select",
        {
          id,
          value: String(value ?? ""),
          onChange: (e) => onChange(prop.name, e.target.value),
          className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          children: prop.options?.map((opt) => /* @__PURE__ */ jsx("option", { value: opt, children: opt }, opt))
        }
      )
    ] });
  }
  if (prop.type === "color") {
    return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1.5", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: id, children: prop.label }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            id,
            type: "color",
            value: String(value ?? "#000000"),
            onChange: (e) => onChange(prop.name, e.target.value),
            className: "h-10 w-10 cursor-pointer rounded-md border border-input bg-background p-1"
          }
        ),
        /* @__PURE__ */ jsx(
          Input,
          {
            value: String(value ?? ""),
            onChange: (e) => onChange(prop.name, e.target.value),
            className: "flex-1"
          }
        )
      ] })
    ] });
  }
  if (prop.type === "number") {
    return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1.5", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: id, children: prop.label }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id,
          type: "number",
          value: String(value ?? ""),
          onChange: (e) => onChange(prop.name, e.target.valueAsNumber)
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1.5", children: [
    /* @__PURE__ */ jsx(Label, { htmlFor: id, children: prop.label }),
    /* @__PURE__ */ jsx(
      Input,
      {
        id,
        type: "text",
        value: String(value ?? ""),
        onChange: (e) => onChange(prop.name, e.target.value)
      }
    )
  ] });
}
function UIBlockPreviewPage({ uiBlockKey, onApprove, onReject, actionSlot }) {
  const [viewport, setViewport] = useState("laptop");
  const uiBlock = UI_BLOCKS_INDEX.find((b) => b.key === uiBlockKey);
  const [props, setProps] = useState(() => ({ ...uiBlock?.defaults }));
  const [reviewOpen, setReviewOpen] = useState(false);
  const reviewRef = useRef(null);
  useEffect(() => {
    if (!reviewOpen) return;
    function handleClick(e) {
      if (reviewRef.current && !reviewRef.current.contains(e.target)) {
        setReviewOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [reviewOpen]);
  if (!uiBlock) {
    return /* @__PURE__ */ jsx("div", { className: "flex h-full flex-col items-center justify-center gap-4", children: /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
      'UI Block "',
      uiBlockKey,
      '" not found.'
    ] }) });
  }
  const UIBlock = uiBlock.component;
  VIEWPORTS.find((v) => v.key === viewport).width;
  function handlePropChange(name, value) {
    setProps((prev) => ({ ...prev, [name]: value }));
  }
  function handleReset() {
    setProps({ ...uiBlock.defaults });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex h-full w-full flex-col overflow-hidden border", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b p-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold leading-tight", children: uiBlock.name }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: uiBlock.description })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "flex gap-1", children: VIEWPORTS.map((v) => /* @__PURE__ */ jsx(
          Button,
          {
            size: "sm",
            variant: viewport === v.key ? "default" : "outline",
            onClick: () => setViewport(v.key),
            children: v.icon
          },
          v.key
        )) }),
        actionSlot ?? ((onApprove || onReject) && /* @__PURE__ */ jsxs("div", { className: "relative", ref: reviewRef, children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              size: "sm",
              variant: "outline",
              onClick: () => setReviewOpen((o) => !o),
              className: "flex items-center gap-1",
              children: [
                "Review ",
                /* @__PURE__ */ jsx(ChevronDown, { className: "h-3.5 w-3.5" })
              ]
            }
          ),
          reviewOpen && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-md border bg-background shadow-md", children: [
            onApprove && /* @__PURE__ */ jsx(
              "button",
              {
                className: "w-full px-3 py-2 text-left text-sm hover:bg-accent",
                onClick: () => {
                  setReviewOpen(false);
                  onApprove({ key: uiBlock.key, name: uiBlock.name, description: uiBlock.description, schema: uiBlock.schema, defaults: uiBlock.defaults });
                },
                children: "Approve"
              }
            ),
            onReject && /* @__PURE__ */ jsx(
              "button",
              {
                className: "w-full px-3 py-2 text-left text-sm hover:bg-accent",
                onClick: () => {
                  setReviewOpen(false);
                  onReject({ key: uiBlock.key, name: uiBlock.name, description: uiBlock.description, schema: uiBlock.schema, defaults: uiBlock.defaults });
                },
                children: "Reject"
              }
            )
          ] })
        ] }))
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex min-h-full min-w-full flex-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "flex flex-1 overflow-auto bg-muted/50", children: /* @__PURE__ */ jsx(
        "div",
        {
          className: "min-h-full min-w-full bg-background transition-all duration-300",
          children: /* @__PURE__ */ jsx(UIBlock, { ...props })
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "flex w-72 flex-col overflow-hidden border-l bg-background", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b px-4 py-3", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: "Edit Props" }),
          /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: handleReset, title: "Reset to defaults", children: /* @__PURE__ */ jsx(RotateCcw, { className: "h-3.5 w-3.5" }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-4 overflow-y-auto p-4", children: uiBlock.schema.props.map((prop) => /* @__PURE__ */ jsx(
          PropField,
          {
            prop,
            value: props[prop.name],
            onChange: handlePropChange
          },
          prop.name
        )) })
      ] })
    ] })
  ] });
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Avatar, AvatarFallback, AvatarImage, Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, hero1_default as Hero1, hero4_default as Hero4, Input, Label, PAGE_TYPE_KEYS, Separator, UIBlockGallery, UIBlockPreviewPage, UIBlockRenderer, UI_BLOCKS_INDEX, UI_BLOCK_CATEGORIES, UI_BLOCK_CATEGORY_KEYS, badgeVariants, buttonVariants };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map