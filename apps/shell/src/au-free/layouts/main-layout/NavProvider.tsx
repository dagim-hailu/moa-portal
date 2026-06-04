"use client";

import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  use,
  useEffect,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import { useBreakpoints } from 'providers/BreakpointsProvider';
import { useSettingsContext } from 'providers/SettingsProvider';
import { COLLAPSE_NAVBAR, EXPAND_NAVBAR } from 'reducers/SettingsReducer';
import { SubMenuItem } from 'routes/sitemap';

interface NavContextInterface {
  openItems: string[];
  setOpenItems: Dispatch<SetStateAction<string[]>>;
  isNestedItemOpen: (items?: SubMenuItem[]) => boolean;
}

const NavContext = createContext({} as NavContextInterface);

const NavProvider = ({ children }: PropsWithChildren) => {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [responsievSidenavCollapsed, setResponsiveSidenavCollapsed] = useState(false);
  const pathname = usePathname();

  const { currentBreakpoint, down } = useBreakpoints();

  const downMd = down('md');

  const {
    config: { sidenavCollapsed },
    setConfig,
    configDispatch,
  } = useSettingsContext();

  const isNestedItemOpen = (items: SubMenuItem[] = []) => {
    const checkLink = (children: SubMenuItem) => {
      if (
        `${children.path}` === pathname ||
        (children.selectionPrefix && pathname!.includes(children.selectionPrefix))
      ) {
        return true;
      }
      return children.items && children.items.some(checkLink);
    };
    return items.some(checkLink);
  };

  useEffect(() => {
    if (sidenavCollapsed) {
      configDispatch({
        type: COLLAPSE_NAVBAR,
      });
    }
    if (currentBreakpoint === 'md') {
      configDispatch({
        type: COLLAPSE_NAVBAR,
      });
      setResponsiveSidenavCollapsed(true);
    }
    if (downMd) {
      configDispatch({
        type: EXPAND_NAVBAR,
      });
    }
    if (currentBreakpoint === 'md') {
      setConfig({
        openNavbarDrawer: false,
      });
    }
    if (!loaded) {
      setLoaded(true);
    }
  }, [currentBreakpoint, downMd]);

  useEffect(() => {
    if (currentBreakpoint !== 'md' && responsievSidenavCollapsed) {
      setResponsiveSidenavCollapsed(false);
      configDispatch({
        type: EXPAND_NAVBAR,
      });
    }
  }, [currentBreakpoint]);

  return (
    <NavContext.Provider
      value={{
        openItems,
        setOpenItems,
        isNestedItemOpen,
      }}
    >
      {loaded && children}
    </NavContext.Provider>
  );
};

export const useNavContext = () => use(NavContext);

export default NavProvider;
