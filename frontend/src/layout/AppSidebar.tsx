import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import {
  HorizontaLDots,
  ChevronDownIcon,
} from "../icons";

// ─── Emoji icons for nav items ────────────────────────────────────────────────
const EmojiIcon = ({ emoji }: { emoji: string }) => (
  <span className="text-base leading-none">{emoji}</span>
);

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  roles?: string[];
  subItems?: { name: string; path: string; roles?: string[] }[];
};

const allNavItems: NavItem[] = [
  { icon: <EmojiIcon emoji="📊" />, name: "Dashboard", path: "/" },
  { icon: <EmojiIcon emoji="🏢" />, name: "Clients", path: "/clients", roles: ["super_admin", "manager"] },
  {
    icon: <EmojiIcon emoji="⏱️" />,
    name: "Time Tracking",
    subItems: [
      { name: "All Entries", path: "/time-entries", roles: ["super_admin", "manager"] },
      { name: "My Hours", path: "/my-hours" },
    ],
  },
  { icon: <EmojiIcon emoji="📈" />, name: "Reports", path: "/reports", roles: ["super_admin", "manager"] },
  { icon: <EmojiIcon emoji="📋" />, name: "Change Log", path: "/changelog" },
  { icon: <EmojiIcon emoji="👥" />, name: "Users", path: "/users", roles: ["super_admin", "manager"] },
  { icon: <EmojiIcon emoji="🔔" />, name: "Notifications", path: "/notifications" },
  { icon: <EmojiIcon emoji="⚙️" />, name: "Settings", path: "/settings", roles: ["super_admin"] },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{ type: "main"; index: number } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Filter nav items by role
  const navItems = allNavItems.filter((item) => {
    if (!item.roles) return true;
    return user?.role && item.roles.includes(user.role);
  }).map((item) => ({
    ...item,
    subItems: item.subItems?.filter((sub) => {
      if (!sub.roles) return true;
      return user?.role && sub.roles.includes(user.role);
    }),
  }));

  const isActive = useCallback(
    (path: string) => {
      if (path === "/") return location.pathname === "/";
      return location.pathname.startsWith(path);
    },
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    navItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({ type: "main", index });
            submenuMatched = true;
          }
        });
      }
    });
    if (!submenuMatched) setOpenSubmenu(null);
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `main-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number) => {
    setOpenSubmenu((prev) => {
      if (prev && prev.type === "main" && prev.index === index) return null;
      return { type: "main", index };
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className={`py-6 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link to="/" className="flex items-center gap-2">
          {isExpanded || isHovered || isMobileOpen ? (
            <img
              src="/hsd-logo.png"
              alt="Health Scale Digital"
              className="h-8 w-auto object-contain dark:brightness-0 dark:invert"
            />
          ) : (
            <img
              src="/hsd-logo.png"
              alt="HSD"
              className="h-8 w-8 object-contain object-left dark:brightness-0 dark:invert"
            />
          )}
        </Link>
      </div>

      {/* Nav */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
                {isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontaLDots className="size-6" />}
              </h2>
              <ul className="flex flex-col gap-4">
                {navItems.map((nav, index) => (
                  <li key={nav.name}>
                    {nav.subItems && nav.subItems.length > 0 ? (
                      <button
                        onClick={() => handleSubmenuToggle(index)}
                        className={`menu-item group ${openSubmenu?.index === index ? "menu-item-active" : "menu-item-inactive"} cursor-pointer ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
                      >
                        <span className={`menu-item-icon-size ${openSubmenu?.index === index ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>{nav.icon}</span>
                        {(isExpanded || isHovered || isMobileOpen) && <span className="menu-item-text">{nav.name}</span>}
                        {(isExpanded || isHovered || isMobileOpen) && (
                          <ChevronDownIcon className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.index === index ? "rotate-180 text-brand-500" : ""}`} />
                        )}
                      </button>
                    ) : (
                      nav.path && (
                        <Link
                          to={nav.path}
                          className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"}`}
                        >
                          <span className={`menu-item-icon-size ${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>{nav.icon}</span>
                          {(isExpanded || isHovered || isMobileOpen) && <span className="menu-item-text">{nav.name}</span>}
                        </Link>
                      )
                    )}
                    {nav.subItems && nav.subItems.length > 0 && (isExpanded || isHovered || isMobileOpen) && (
                      <div
                        ref={(el) => { subMenuRefs.current[`main-${index}`] = el; }}
                        className="overflow-hidden transition-all duration-300"
                        style={{ height: openSubmenu?.index === index ? `${subMenuHeight[`main-${index}`]}px` : "0px" }}
                      >
                        <ul className="mt-2 space-y-1 ml-9">
                          {nav.subItems.map((subItem) => (
                            <li key={subItem.name}>
                              <Link
                                to={subItem.path}
                                className={`menu-dropdown-item ${isActive(subItem.path) ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive"}`}
                              >
                                {subItem.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
