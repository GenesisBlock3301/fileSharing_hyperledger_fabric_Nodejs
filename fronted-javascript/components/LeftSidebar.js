
import { Layout, Menu } from "antd";
import {
  FolderOpenOutlined,
  ShareAltOutlined,
  UserAddOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useRouter } from 'next/router'
;
const { Header, Content, Footer, Sider } = Layout;

function LeftSidebar() {
  const router = useRouter();

  return (
    <Sider
      style={{
        overflow: "auto",
        height: "100vh",
        position: "fixed",
        left: 0,
      }}
    >
      <h2 className="logo">File-Sharing</h2>
      <Menu theme="dark" mode="inline" defaultSelectedKeys={["4"]}>
        <Menu.Item key="1" icon={<UserAddOutlined />} onClick={()=>router.push("/register")}>
          Register
        </Menu.Item>
        <Menu.Item key="2" icon={<UserOutlined />} onClick={()=>router.push("/login")}>
          Login
        </Menu.Item>
        <Menu.Item key="3" icon={<UploadOutlined />} onClick={()=>router.push("/uploadFiles")}>
          UploadFiles
        </Menu.Item>
        <Menu.Item key="4" icon={<FolderOpenOutlined />} onClick={()=>router.push("/myFiles")}>
          MyFiles
        </Menu.Item>
        <Menu.Item key="5" icon={<ShareAltOutlined />} onClick={()=>router.push("/sharedWithMe")}>
          Shared With Me
        </Menu.Item>
      </Menu>
    </Sider>
  );
}
export default LeftSidebar;
