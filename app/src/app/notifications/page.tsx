"use client";

import { Card, Empty, Typography, Space } from "antd";
import { BellOutlined } from "@ant-design/icons";
import AuthGuard from "@/components/guards/AuthGuard";

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BellOutlined className="text-2xl text-orange-500" />
          <Typography.Title level={4} className="mb-0">
            Thông báo
          </Typography.Title>
        </div>

        <Card>
          <Empty description="Chưa có thông báo nào" />
        </Card>
      </div>
    </AuthGuard>
  );
}
