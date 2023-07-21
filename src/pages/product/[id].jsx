import Header from "@/components/header"
import Footer from "@/components/footer"
import React, { useEffect, useRef, useState } from "react"
import { IoIosArrowForward } from "react-icons/io"
import Image from "next/image"
import default_picture from "/public/default.jpg"
import { FiTrash2 } from "react-icons/fi"
import { useRouter } from "next/router"
import { useDispatch, useSelector } from "react-redux"
import { clearProduct, productDetail } from "@/redux/reducers/product"
import { PURGE } from "redux-persist"
import { withIronSessionSsr } from "iron-session/next"
import checkCredentials from "@/helpers/checkCredentials"
import cookieConfig from "@/helpers/cookieConfig"
import { Formik } from "formik"
import http from "@/helpers/http"
import Link from "next/link"
import { variantDetail } from "@/redux/reducers/variant"

export const getServerSideProps = withIronSessionSsr(async ({ req, res }) => {
  const token = req.session.token || null
  checkCredentials(token, res, "/auth/login")
  return {
    props: {
      token,
    },
  }
}, cookieConfig)

function DetailProduct({ token }) {
  const dispatch = useDispatch()
  const variant = useSelector((state) => state.variant.data)
  const [editProduct, setEditProduct] = React.useState(false)
  const [product, setProduct] = React.useState([])
  const productDetails = useSelector((state) => state.product.data)
  const [roleId, setRoleId] = useState("")
  const [selectedVariant, setSelectedVariant] = useState({
    code: "",
    name: "",
    price: variant.price,
    deliveryMethod: "",
    quantity: 1,
  })
  console.log(selectedVariant)
  function increment() {
    if (selectedVariant.quantity >= 10) {
      setSelectedVariant((prevState) => ({ ...prevState, quantity: 10 }))
    } else {
      setSelectedVariant((prevState) => ({
        ...prevState,
        quantity: selectedVariant.quantity + 1,
      }))
    }
  }

  const doCheckout = () => {
    dispatch(variantDetail(selectedVariant))
    router.replace("/payment")
  }

  function decrement() {
    if (selectedVariant.quantity <= 1) {
      setSelectedVariant((prevState) => ({ ...prevState, quantity: 1 }))
    } else {
      setSelectedVariant((prevState) => ({
        ...prevState,
        quantity: selectedVariant.quantity - 1,
      }))
    }
  }

  useEffect(() => {
    async function getRoleId() {
      try {
        const { data } = await http(token).get("/users")
        setRoleId(data.results)
      } catch (err) {
        console.log(err)
      }
    }

    getRoleId()
  }, [token, roleId])

  const router = useRouter()
  const { id } = router.query

  React.useEffect(() => {
    if (!productDetails) {
      router.replace("/product")
    }
  }, [router, productDetails])

  const editProductAdmin = async (values) => {
    const form = new FormData()
    Object.keys(values).forEach((key) => {
      if (values[key]) {
        form.append(key, values[key])
      }
    })
    try {
      const data = await http(token).patch(`/products/manage/${id}`, form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      setProduct(data.result)
      console.log(data)
    } catch (err) {
      console.log(err)
    }
    setEditProduct(false)
  }

  React.useEffect(() => {
    const handleChangeRouter = () => {
      dispatch({
        type: PURGE,
        key: "product",
        result: () => null,
      })
      dispatch(clearProduct)
    }
    router.events.on("routeChangeStart", handleChangeRouter)
  })

  return (
    <div className="h-min-screen">
      <div className="pb-24 header">
        <Header token={token} />
      </div>
      <div className="h-[100%] pt-10">
        <div className="flex h-full px-16 md:px-24 py-10 flex-col md:flex-row border-[1px] border-black">
          <div className="flex md:w-[50%] pb-10 border-[1px] border-black">
            <div className="flex flex-col gap-4 w-full">
              <div className="flex font-bold items-center md:text-[20px] ">
                Favourit & Promo <IoIosArrowForward size={30} />
                <div>name product</div>
              </div>
              <div className="md:h-[700px] relative  border-[1px] border-black">
                {productDetails.picture === null ? (
                  <Image
                    src={default_picture}
                    alt="img-product.png"
                    className="object-cover h-full w-full"
                  />
                ) : (
                  <Image
                    alt="img-product.png"
                    width="400"
                    height="400"
                    src={productDetails.picture}
                    className="object-cover h-full w-full"
                  />
                )}
                <button className="absolute top-10 right-10 bg-secondary h-14 w-14 rounded-full flex justify-center items-center">
                  <FiTrash2 size={30} />
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-1">
            <Formik
              initialValues={{
                name: productDetails?.name,
                description: productDetails?.description,
              }}
              onSubmit={editProductAdmin}
              enableReinitialize
            >
              {({ handleSubmit, handleChange, handleBlur, values }) => (
                <form onSubmit={handleSubmit} className="flex flex-1">
                  <div className="flex flex-col gap-4 px-10 w-full border-[1px] border-black">
                    {!editProduct && (
                      <div className="font-bold text-2xl md:tex-4xl lg:text-6xl">
                        {productDetails.name}
                      </div>
                    )}
                    {editProduct && (
                      <input
                        type="text"
                        className="input input-ghost bg-transparent w-full max-w-xs"
                        name="name"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.name}
                      />
                    )}
                    <div className="border-t-2 border-b-2 text-2xl md:text-[40px] py-2">
                      {variant.price}
                    </div>
                    <div className="text-2xl md:text-[40px] font-semi-bold py-4 border-b-2 ">
                      {productDetails.description}
                    </div>
                    <div className="flex flex-col gap-8">
                      <div className="w-full h-24 pt-8">
                        <select
                          onChange={(e) => {
                            setSelectedVariant((prevState) => ({
                              ...prevState,
                              name: e.target.value,
                            }))
                            if (e.target.value === "Regular") {
                              setSelectedVariant((prevState) => ({
                                ...prevState,
                                code: "R",
                              }))
                            } else if (e.target.value === "Medium") {
                              setSelectedVariant((prevState) => ({
                                ...prevState,
                                code: "M",
                              }))
                            } else if (e.target.value === "Large") {
                              setSelectedVariant((prevState) => ({
                                ...prevState,
                                code: "L",
                              }))
                            } else if (e.target.value === "Extra Large") {
                              setSelectedVariant((prevState) => ({
                                ...prevState,
                                code: "XL",
                              }))
                            }
                          }}
                          className="select select-primary w-full h-full text-lg md:text-[20px]"
                        >
                          <option value="">--Select Size--</option>
                          <option value="Regular">Regular</option>
                          <option value="Medium">Medium</option>
                          <option value="Large">Large</option>
                          <option value="Extra Large">Extra Large</option>
                        </select>
                      </div>
                      <div className="w-full pt-0 h-16">
                        <select
                          onChange={(e) => {
                            setSelectedVariant((prevState) => ({
                              ...prevState,
                              deliveryMethod: e.target.value,
                            }))
                          }}
                          className="select select-primary w-full h-full text-lg md:text-[20px]"
                        >
                          <option disabled selected>
                            --Select Delivery Methods--
                          </option>
                          <option value="Dine In">Dine In</option>
                          <option value="Door Delivery">Door Delivery</option>
                          <option value="Pick Up">Pick Up</option>
                        </select>
                      </div>
                      <div className="flex gap-4 w-full h-16">
                        <div className="h-full rounded-xl flex justify-between items-center w-[40%] border bordered-2 px-4">
                          <button
                            type="button"
                            onClick={decrement}
                            className="p-2 text-[20px] "
                          >
                            -
                          </button>
                          <div className="p-2">
                            {!selectedVariant.quantity
                              ? "0"
                              : selectedVariant.quantity}
                          </div>
                          <button
                            type="button"
                            onClick={increment}
                            className="p-2 text-[20px]"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex flex-1 h-full ">
                          <button
                            type="button"
                            className="btn btn-secondary w-full h-full text-white normal-case"
                          >
                            Add to Chart
                          </button>
                        </div>
                      </div>
                      {roleId === 1 && (
                        <div className="flex flex-col gap-2">
                          <div className="w-full h-16">
                            <button
                              type="submit"
                              className="btn btn-primary w-full h-full"
                            >
                              Save Change
                            </button>
                          </div>
                          <div className="w-full h-16">
                            <button
                              type="button"
                              className="btn btn-primary w-full h-full"
                              onClick={() => setEditProduct(true)}
                            >
                              Edit Product
                            </button>
                          </div>
                        </div>
                      )}
                      {roleId === 2 && (
                        <div>
                          <button
                            type="submit"
                            onClick={() => doCheckout()}
                            className="btn btn-primary w-full"
                          >
                            Checkout
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              )}
            </Formik>
          </div>
        </div>
        <Footer />
        <input type="checkbox" id="deleteProduct" className="modal-toggle" />
        <div className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Alert!</h3>
            <p className="py-4">Are you sure want to delete this product</p>
            <div className="modal-action">
              <label
                htmlFor="deleteProduct"
                className="btn btn-error normal-case text-white cursor-pointer"
              >
                Yes!
              </label>
              <label
                htmlFor="deleteProduct"
                className="btn btn-success normal-case text-white cursor-pointer"
              >
                No!
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DetailProduct
