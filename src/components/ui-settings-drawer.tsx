import { uiSettings$ } from "@/livestore/queries/ui-settings";
import {
  uiSettingsEvents,
  type FontSize,
  type Mode,
  type SquadOrder,
  type Theme,
} from "@/livestore/schema/ui-settings";
import { useStore } from "@livestore/react";
import { Link } from "@tanstack/react-router";
import {
  ArrowDownAZIcon,
  ArrowRightIcon,
  CircleIcon,
  ClockIcon,
  MonitorIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
  TabletIcon,
  TabletSmartphoneIcon,
  XIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import { Label } from "./ui/label";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

export const UiSettingsDrawer = () => {
  const { store } = useStore();
  const uiSettings = store.useQuery(uiSettings$);

  const handleModeChange = (value: Mode) => {
    store.commit(uiSettingsEvents.uiSettingsUpdated({ mode: value }));
  };
  const handleThemeChange = (value: Theme) => {
    store.commit(uiSettingsEvents.uiSettingsUpdated({ theme: value }));
  };
  const handleFontSizeChange = (value: FontSize) => {
    store.commit(uiSettingsEvents.uiSettingsUpdated({ fontSize: value }));
  };
  const handleSquadOrderChange = (value: SquadOrder) => {
    store.commit(uiSettingsEvents.uiSettingsUpdated({ squadOrder: value }));
  };

  return (
    <Drawer direction="right">
      <DrawerTrigger>
        <Button variant="outline" size="icon">
          <SettingsIcon className="size-4.5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="p-0">
        <DrawerHeader className="px-6 py-4 bg-white/4 border-b flex flex-row items-center justify-between">
          <DrawerTitle className="text-lg">Schnelleinstellungen</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon">
              <XIcon className="size-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="p-6 border-b space-y-6">
          <div className="space-y-2">
            <Label className="leading-tight">App-Modus</Label>
            <ToggleGroup
              disabled
              value={uiSettings.mode}
              onValueChange={handleModeChange}
              type="single"
              variant="outline"
              className="w-full"
            >
              <ToggleGroupItem value="desktop" className="grow">
                <MonitorIcon className="size-4 opacity-50" />
                <span>Desktop</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="tablet-only" className="grow">
                <TabletIcon className="size-4 opacity-50" />
                <span>Nur Tablet</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="tablet-additional" className="grow">
                <TabletSmartphoneIcon className="size-4 opacity-50" />
                <span>Zusatz-Gerät</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="space-y-2">
            <Label className="leading-tight">Farbmodus</Label>
            <ToggleGroup
              disabled
              value={uiSettings.theme}
              onValueChange={handleThemeChange}
              type="single"
              variant="outline"
              className="w-full"
            >
              <ToggleGroupItem value="dark" className="grow">
                <MoonIcon className="size-4 opacity-50" />
                <span>Dunkel</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="light" className="grow">
                <SunIcon className="size-4 opacity-50" />
                <span>Hell</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="system" className="grow">
                <MonitorIcon className="size-4 opacity-50" />
                <span>System</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="space-y-2">
            <Label className="leading-tight">Schriftgröße</Label>
            <ToggleGroup
              disabled
              value={uiSettings.fontSize}
              onValueChange={handleFontSizeChange}
              type="single"
              variant="outline"
              className="w-full"
            >
              <ToggleGroupItem value="default" className="grow">
                <span>Normal</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="lg" className="grow">
                <span>Groß</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="xl" className="grow">
                <span>Extra groß</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
        <div className="p-6 border-b space-y-6">
          <div className="space-y-2">
            <Label className="leading-tight">Trupp-Sortierung</Label>
            <ToggleGroup
              value={uiSettings.squadOrder}
              onValueChange={handleSquadOrderChange}
              type="single"
              variant="outline"
              className="w-full"
            >
              <ToggleGroupItem value="status" className="grow">
                <CircleIcon className="size-4 opacity-50" />
                <span>Status</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="createdAt" className="grow">
                <ClockIcon className="size-4 opacity-50" />
                <span>Erstellt</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="alphabetical" className="grow">
                <ArrowDownAZIcon className="size-4 opacity-50" />
                <span>Name</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
        <DrawerFooter className="p-6 bg-white/4 border-t">
          <Button variant="outline" className="w-full" asChild>
            <Link to="/">
              <span>Zu den Einstellungen</span>
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
