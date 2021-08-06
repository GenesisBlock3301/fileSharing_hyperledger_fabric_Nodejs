import "../styles/globals.css";
import "antd/dist/antd.css";
import { Layout, Menu } from "antd";
import LeftSidebar from '../components/LeftSidebar'

const { Header, Content, Footer, Sider } = Layout;

function MyApp({ Component, pageProps }) {
  return (
    <Layout>
      <LeftSidebar />
      <Layout className="site-layout" style={{ marginLeft: 200 }}>
        <Header className="site-layout-background" style={{ padding: 0 }} />
        <Content style={{ margin: "24px 16px 0", overflow: "initial" }}>
          <div
            className="site-layout-background"
            style={{ padding: 24}}
          >
            {/*  */}
            <Component {...pageProps} />
            {/*  */}
          </div>
        </Content>
        <Footer style={{ textAlign: "center" }}>
          Ant Design ©2018 Created by Ant UED
        </Footer>
      </Layout>
    </Layout>
  );
}

export default MyApp;

// //////////////////
