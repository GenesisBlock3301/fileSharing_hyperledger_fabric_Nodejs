import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import { Form, Input, InputNumber, Button } from "antd";
import { useRouter } from "next/router";
import useSWR from 'swr'
import useUser from '../lib/useUser'

const layout = {
  labelCol: {
    span: 4,
  },
  wrapperCol: {
    span: 12,
  },
};
/* eslint-disable no-template-curly-in-string */

const validateMessages = {
  required: "${label} is required!",
  types: {
    email: "${label} is not a valid email!",
    number: "${label} is not a valid number!",
  },
  number: {
    range: "${label} must be between ${min} and ${max}",
  },
};
/* eslint-enable no-template-curly-in-string */

const LoginPage = () => {
  const router = useRouter();
  const handleSubmit = async (values) => {
    console.log(values);
    const { name, email, password } = values.user;
    const url = "http://localhost:3000/login";

    console.log("Start working here");

    const body = {
      email: email,
      password: password,
    };
    const response = await fetch(url, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "include",
      withCredentials:true,
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow",
      referrerPolicy: "no-referrer",
      body: JSON.stringify(body),
    });
    const data = await response.json();

    console.log("data", data);
    if('error' in data){
        alert(data['error'])
    }
    await router.push("/");
  };

  return (
    <Form
      {...layout}
      name="nest-messages"
      onFinish={handleSubmit}
      validateMessages={validateMessages}
    >
      
      <Form.Item
        name={["user", "email"]}
        label="Email"
        rules={[{ type: "email" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="Password"
        name={["user", "password"]}
        rules={[{ required: true, message: "Please input your password!" }]}
      >
        <Input.Password />
      </Form.Item>

      <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};
export default LoginPage;
