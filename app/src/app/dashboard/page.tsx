"use client";

import { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Avatar,
  Button,
  Tag,
  Empty,
  Skeleton,
  Space,
  Tooltip,
} from "antd";
import {
  LogoutOutlined,
  ProjectOutlined,
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { getProjectsByUser } from "@/modules/project/project.service";
import { getMe } from "@/modules/account/account.service";
import { IProject } from "@/modules/project/project.types";
import { IAccount } from "@/modules/account/account.types";

export default function Dashboard() {
  const [user, setUser] = useState<IAccount | null>(null);
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      // Get user ID from localStorage
      const userId = localStorage.getItem("userId");

      if (!userId) {
        router.push("/login");
        return;
      }

      // Fetch user info (uses JWT token)
      const userInfo = await getMe();
      setUser(userInfo);

      // Fetch user projects (uses JWT token)
      const userProjects = await getProjectsByUser();
      setProjects(userProjects);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    router.push("/login");
  };

  const handleViewProject = (projectId: number) => {
    router.push(`/projects/${projectId}`);
  };

  const getStatusTag = (status?: string) => {
    const statusMap: Record<string, { color: string; icon: React.ReactNode }> =
      {
        completed: {
          color: "success",
          icon: <CheckCircleOutlined />,
        },
        ongoing: {
          color: "processing",
          icon: <ClockCircleOutlined />,
        },
        pending: {
          color: "warning",
          icon: <ExclamationCircleOutlined />,
        },
      };

    const config = statusMap[status || "pending"];
    return (
      <Tag icon={config.icon} color={config.color}>
        {status || "Chưa xác định"}
      </Tag>
    );
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    return parts.map((p) => p[0]).join("").toUpperCase();
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row gap-6 p-4 md:p-6">
        <div className="flex-1 space-y-6">
          <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-200">
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Card className="shadow-none border-none">
                  <Row align="middle" gutter={16}>
                    <Col>
                      <Avatar
                        size={80}
                        style={{ backgroundColor: "#1890ff" }}
                        icon={getInitials(user?.name)}
                      >
                        {getInitials(user?.name)}
                      </Avatar>
                    </Col>
                    <Col flex="auto">
                      {loading ? (
                        <Skeleton paragraph={false} active />
                      ) : (
                        <div>
                          <h1 className="text-2xl font-bold mb-0">
                            Xin chào, {user?.name}!
                          </h1>
                          <p className="text-gray-500 mb-0">{user?.email}</p>
                          {user?.role && (
                            <Tag color="blue" className="mt-2">
                              {user.role}
                            </Tag>
                          )}
                        </div>
                      )}
                    </Col>
                    <Col>
                      <Space orientation="vertical">
                        <Tooltip title="Đăng xuất">
                          <Button
                            type="primary"
                            danger
                            icon={<LogoutOutlined />}
                            onClick={handleLogout}
                          >
                            Đăng xuất
                          </Button>
                        </Tooltip>
                      </Space>
                    </Col>
                  </Row>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Card className="shadow-sm text-center">
                      <ProjectOutlined style={{ fontSize: 24, color: "#1890ff" }} />
                      <h3 className="mt-2 mb-0">
                        {loading ? <Skeleton paragraph={false} /> : projects.length}
                      </h3>
                      <p className="text-gray-500 text-sm">Dự án</p>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Card className="shadow-sm text-center">
                      <BellOutlined style={{ fontSize: 24, color: "#faad14" }} />
                      <h3 className="mt-2 mb-0">
                        {loading ? <Skeleton paragraph={false} /> : 0}
                      </h3>
                      <p className="text-gray-500 text-sm">Lời mời chờ xử lý</p>
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>
          </div>

          <div className="space-y-8">
            <Card
              title={
                <Space>
                  <ProjectOutlined />
                  <span>Dự án của bạn</span>
                </Space>
              }
              extra={
                <Button type="primary" onClick={() => router.push("/projects")}>xem tất cả</Button>
              }
            >
              {loading ? (
                <Skeleton active paragraph={{ rows: 4 }} />
              ) : projects.length === 0 ? (
                <Empty description="Không có dự án nào" />
              ) : (
                <Row gutter={[16, 16]}>
                  {projects.slice(0, 6).map((project) => (
                    <Col xs={24} sm={12} lg={8} key={project.id}>
                      <Card hoverable className="h-full" onClick={() => handleViewProject(project.id)}>
                        <div className="mb-3">
                          <h4 className="font-semibold truncate">{project.name}</h4>
                          <p className="text-gray-600 text-sm line-clamp-2 mb-0">
                            {project.description || "Không có mô tả"}
                          </p>
                        </div>

                        <div className="mb-3 flex justify-between items-center">
                          {project.status && getStatusTag(project.status)}
                        </div>

                        <div className="text-xs text-gray-400 space-y-1">
                          {project.start_date && (
                            <p>
                              <strong>Bắt đầu:</strong>{" "}
                              {new Date(project.start_date).toLocaleDateString("vi-VN")}
                            </p>
                          )}
                          {project.end_date && (
                            <p>
                              <strong>Kết thúc:</strong>{" "}
                              {new Date(project.end_date).toLocaleDateString("vi-VN")}
                            </p>
                          )}
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card>

            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Card
                  title={
                    <Space>
                      <BellOutlined />
                      <span>Lời mời chờ xử lý</span>
                    </Space>
                  }
                >
                  <Empty description="Không có lời mời nào" />
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card
                  title={
                    <Space>
                      <CheckCircleOutlined />
                      <span>Công việc cần làm</span>
                    </Space>
                  }
                >
                  <Empty description="Không có công việc nào" />
                </Card>
              </Col>
            </Row>
          </div>
        </div>
      </div>
    </div>
  );
}
