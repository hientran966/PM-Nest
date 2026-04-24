"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Row,
  Col,
  Card,
  Empty,
  Skeleton,
  Button,
  Typography,
  Space,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Divider,
  Tag,
  AutoComplete,
} from "antd";
import { ProjectOutlined, ArrowRightOutlined, PlusOutlined, UserAddOutlined, CloseOutlined } from "@ant-design/icons";
import AuthGuard from "@/components/guards/AuthGuard";
import { getProjectsByUser, createProject } from "@/modules/project/project.service";
import { IProject } from "@/modules/project/project.types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [invitedMembers, setInvitedMembers] = useState<string[]>([]);
  const [memberInput, setMemberInput] = useState("");
  const [form] = Form.useForm();
  const router = useRouter();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("userId");
      if (!userId) {
        router.push("/login");
        return;
      }

      const userProjects = await getProjectsByUser();
      setProjects(userProjects);
    } catch (error) {
      console.error("Failed to load projects", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProject = (projectId: number) => {
    router.push(`/projects/${projectId}`);
  };

  const handleCreateProject = async (values: any) => {
    try {
      setCreating(true);
      console.log("Creating project with values:", values);

      // Validate dates
      if (values.start_date && values.end_date) {
        if (values.start_date.isAfter(values.end_date)) {
          message.error("Ngày kết thúc phải sau ngày bắt đầu!");
          return;
        }
      }

      const projectData = {
        ...values,
        start_date: values.start_date?.format("YYYY-MM-DD"),
        end_date: values.end_date?.format("YYYY-MM-DD"),
        //members: invitedMembers.map(email => ({ email, role: 'member' })),
      };

      await createProject(projectData);
      message.success("Tạo dự án thành công!");
      setModalVisible(false);
      form.resetFields();
      setInvitedMembers([]);
      setMemberInput("");
      loadProjects();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Tạo dự án thất bại!");
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
    form.resetFields();
    setInvitedMembers([]);
    setMemberInput("");
  };

  const handleAddMember = () => {
    if (memberInput.trim() && !invitedMembers.includes(memberInput.trim())) {
      setInvitedMembers([...invitedMembers, memberInput.trim()]);
      setMemberInput("");
    }
  };

  const handleRemoveMember = (email: string) => {
    setInvitedMembers(invitedMembers.filter(m => m !== email));
  };

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Space>
            <ProjectOutlined className="text-xl text-blue-600" />
            <Typography.Title level={4} className="mb-0">
              Dự án của tôi
            </Typography.Title>
          </Space>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalVisible(true)}
            >
              Tạo dự án mới
            </Button>
            <Button onClick={loadProjects}>
              Refresh
            </Button>
          </Space>
        </div>

        {loading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : projects.length === 0 ? (
          <Card>
            <Empty description="Không tìm thấy dự án" />
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {projects.map((project) => (
              <Col xs={24} sm={12} lg={8} key={project.id}>
                <Card
                  hoverable
                  title={project.name}
                  extra={
                    <Button
                      type="link"
                      icon={<ArrowRightOutlined />}
                      onClick={() => handleViewProject(project.id)}
                    >
                      Xem
                    </Button>
                  }
                >
                  <p className="text-gray-600 mb-3">
                    {project.description || "Không có mô tả"}
                  </p>
                  <p className="text-sm text-gray-500 mb-0">
                    Trạng thái: <strong>{project.status || "Chưa xác định"}</strong>
                  </p>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>

      <Modal
        title="Tạo dự án mới"
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateProject}
          autoComplete="off"
        >
          <Form.Item
            label="Tên dự án"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên dự án!" }]}
          >
            <Input placeholder="Nhập tên dự án" />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
          >
            <Input.TextArea
              placeholder="Nhập mô tả dự án (tùy chọn)"
              rows={3}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Ngày bắt đầu"
                name="start_date"
              >
                <DatePicker
                  placeholder="Chọn ngày bắt đầu"
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Ngày kết thúc"
                name="end_date"
              >
                <DatePicker
                  placeholder="Chọn ngày kết thúc"
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Trạng thái"
            name="status"
            initialValue="pending"
          >
            <Select placeholder="Chọn trạng thái">
              <Select.Option value="pending">Chưa bắt đầu</Select.Option>
              <Select.Option value="ongoing">Đang thực hiện</Select.Option>
              <Select.Option value="completed">Hoàn thành</Select.Option>
            </Select>
          </Form.Item>

          <Divider>
            <Space>
              <UserAddOutlined />
              Mời thành viên (tùy chọn)
            </Space>
          </Divider>

          <Form.Item label="Email thành viên">
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="Nhập email thành viên"
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onPressEnter={handleAddMember}
              />
              <Button type="primary" onClick={handleAddMember}>
                Thêm
              </Button>
            </Space.Compact>
          </Form.Item>

          {invitedMembers.length > 0 && (
            <Form.Item label="Danh sách mời">
              <Space wrap>
                {invitedMembers.map((email) => (
                  <Tag
                    key={email}
                    closable
                    onClose={() => handleRemoveMember(email)}
                    color="blue"
                  >
                    {email}
                  </Tag>
                ))}
              </Space>
            </Form.Item>
          )}

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={handleCancel}>
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={creating}
              >
                Tạo dự án
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </AuthGuard>
  );
}
