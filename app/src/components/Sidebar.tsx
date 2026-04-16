"use client";

import { useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { DashboardOutlined, ProjectOutlined, BellOutlined } from "@ant-design/icons";
import { Menu, Tooltip } from "antd";

const menuItems = [
  {
    key: "/",
    label: "Dashboard",
    icon: <DashboardOutlined />,
  },
  {
    key: "/projects",
    label: "Dự Án",
    icon: <ProjectOutlined />,
  },
  {
    key: "/notifications",
    label: "Thông Báo",
    icon: <BellOutlined />,
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const activeKey = useMemo(() => {
    if (pathname === "/") return "/";
    if (pathname?.startsWith("/projects")) return "/projects";
    if (pathname?.startsWith("/notifications")) return "/notifications";
    return "/";
  }, [pathname]);

  const items = menuItems.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
  }));

  return (
    <aside className="h-screen w-20 border-r border-gray-200 bg-white transition-all duration-300">
      <Menu
        mode="inline"
        selectedKeys={[activeKey]}
        inlineCollapsed={true}
        items={items}
        onClick={({ key }) => router.push(key)}
        className="h-full border-none"
        theme="dark"
      />
    </aside>
  );
}