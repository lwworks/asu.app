import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Logo } from "@/components/visuals/logo";
import { Link } from "@tanstack/react-router";
import { Fragment } from "react/jsx-runtime";
import { UiSettingsDrawer } from "./ui-settings-drawer";

export const Header = ({
  breadcrumbs,
  tabs,
  children,
}: {
  breadcrumbs?: { label: string; href: string }[];
  tabs?: { label: string; href: string }[];
  children?: React.ReactNode;
}) => {
  return (
    <header className="border-b px-8">
      <div className="flex items-center justify-between h-16">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">
                  <Logo className="h-4 text-white" />
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs?.map((breadcrumb) => (
              <Fragment key={breadcrumb.href}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={breadcrumb.href}>{breadcrumb.label}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-4">
          {children}
          <UiSettingsDrawer />
        </div>
      </div>
      <ul className="flex -mb-px text-sm gap-4">
        {tabs?.map((tab) => (
          <li key={tab.href}>
            <Link
              to={tab.href}
              className="flex items-end border-b border-transparent hover:text-foreground transition-all pb-3 h-8 data-[status=active]:border-primary data-[status=active]:text-foreground"
              activeOptions={{ exact: true }}
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </header>
  );
};
