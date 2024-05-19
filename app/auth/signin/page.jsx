'use client'

import { useState, useEffect } from 'react'
import { notify } from '../../../util/notify/notifyMain'
import { createSession } from '../../../util/jwt/session'
import Cookies from 'js-cookie'
import { createCookie } from '../../../util/cookies/main'


const successRedirect = '/'
const sessionCookieName = '_session'
export default function SignIn() {

    const [disablePageActions, setDisablePageActions] = useState(false)
    const [accessToken, setAccessToken] = useState('')
    // const [email, setEmail] = useState('')
    // const [password, setPassword] = useState('')


    async function handleSubmit(e) {
        e.preventDefault()

        // if (email === '' || password === '') {
        //     notify('error', 'Email and password are required')
        //     return
        // }

        // if (!email.includes('@') || !email.includes('.')) {
        //     notify('error', 'Invalid email')
        //     return
        // }

        if (accessToken.length === 0) {
            notify('error', 'Access Token is required')
            return
        }

        if (accessToken.length < 5) {
            notify('error', 'Access Token is invalid')
            return
        }

        setDisablePageActions(true)
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ accessToken: accessToken })
        })
        const resBody = await response.json()
        setDisablePageActions(false)
        // console.log(resBody)
        if (resBody.success) {
            // createSession(resBody.data)
            //create cookie with access token
            const accessToken = resBody.data.accessToken
            if (!accessToken) {
                notify('error', 'Access Token is invalid')
                return
            }

            const expiresIn = 60 * 60 * 24 * 3; //3 days
            const cookieObj = {
                accessToken: accessToken,
                expiresIn: expiresIn
            };
            const cookieRes = createCookie(sessionCookieName, cookieObj, 3);
            if (!cookieRes.success) {
                notify('error', 'Failed to create session cookie')
                return
            }else{
                window.location.href = successRedirect;
            }


        } else {
            notify('error', resBody.message)
        }
    }



    // useEffect(() => {
    //     const sessionCookie = Cookies.get(sessionCookieName)
    //     if (sessionCookie) {
    //         window.location.href = successRedirect;
    //     }
    // }, [])


    return (
        <div className="container-xxl container-main">
            <div className="row">
                <div className='col'></div>
                <div className='col custom-card'>
                    <form onSubmit={handleSubmit}>
                        <div className="row mt-3 mb-5">
                            <div className="col d-flex justify-content-center align-items-center">
                                <h3>Sing In</h3>
                            </div>
                        </div>
                        <div className="row mb-3 d-flex justify-content-center align-items-center">
                            <div className='row'>
                                <div className='col d-flex justify-content-center'>
                                    <span>
                                        Access Token
                                    </span>
                                </div>
                            </div>
                            <div className="col d-flex justify-content-center">
                                <input
                                    required={true}
                                    style={{ maxWidth: "300px" }}
                                    type="text"
                                    className='form-control'
                                    placeholder='Enter Access Token'
                                    value={accessToken}
                                    onChange={(e) => setAccessToken(e.target.value)}
                                />
                            </div>

                        </div>
                        {/* <div className="row mb-3">
                            <div className="col d-flex justify-content-center">
                                <input
                                    required={true}
                                    style={{ maxWidth: "300px" }}
                                    type="password"
                                    className='form-control'
                                    placeholder='password'
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div> */}
                        <div className="row mt-5 mb-5">
                            <div className="col d-flex justify-content-center align-items-center">
                                <button
                                    disabled={disablePageActions}
                                    className='btn btn-primary'
                                    type="submit"
                                >Sign in</button>
                            </div>
                        </div>
                    </form>
                </div>
                <div className='col'></div>

            </div>
        </div>

    )
}