import React, { useRef, useState } from "react";
// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";

// import required modules
import { Pagination } from "swiper";
import Box from "@mui/material/Box";
import Navbar from "../../ui/Navbar";
import Stack from "@mui/material/Stack";


const CommunityGidelines = () => {
    return (

        <>
            <Navbar />
            <Box sx={{ padding: 2 }}>
                <Stack>
                    <Box>
                        <Swiper pagination={true} modules={[Pagination]} className="mySwiper">
                            <SwiperSlide>
                                <Box sx={{ height: 500, width: 396, border: '1px black solid' }}>

                                </Box>
                            </SwiperSlide>
                            <SwiperSlide>
                                <Box sx={{ height: 500 }}>

                                </Box>
                            </SwiperSlide>
                            <SwiperSlide>
                                <Box sx={{ height: 500 }}>

                                </Box>
                            </SwiperSlide>

                        </Swiper>
                    </Box>
                </Stack>
            </Box>
        </>

    )
}

export default CommunityGidelines;