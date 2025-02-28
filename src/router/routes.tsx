import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Title from '../page/Title'
import Home from '../page/Home'
import Work from '../page/Work'
import Setting from '../page/Setting'
import Help from '../page/Help'
import Schedule from '../page/Schedule'

const Router = () => {
    return (
        <Routes>
            <Route path='/' element={<Title />} />
            <Route path='/home' element={<Home />} />
            <Route path='/work' element={<Work />} />
            <Route path='/setting' element={<Setting />} />
            <Route path='/help' element={<Help />} />
            <Route path='/schedule' element={<Schedule />} />
        </Routes >
    )
}

export default Router