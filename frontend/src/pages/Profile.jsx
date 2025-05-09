import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { BiArrowBack, BiUpload } from 'react-icons/bi'
import axios from 'axios'
import { setProfilePic, setUser } from '../redux/userSlice'

// Default avatar as base64 string
const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzZCNzI4MCI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MyLjY3IDAgNC44NCAyLjE3IDQuODQgNC44NFMxNC42NyAxNC42OCAxMiAxNC42OHMtNC44NC0yLjE3LTQuODQtNC44NFM5LjMzIDUgMTIgNXptMCAxM2MtMi4zOSAwLTQuNS44NS02LjE5IDIuMjUuODQgMy4xMiAzLjc2IDUuNCA3LjE5IDUuNCAzLjQzIDAgNi4zNS0yLjI4IDcuMTktNS40LTEuNjktMS40LTMuOC0yLjI1LTYuMTktMi4yNXoiLz48L3N2Zz4="

function Profile() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { userdata } = useSelector((state) => state.user)
    const [uploading, setUploading] = useState(false)
    const [previewImage, setPreviewImage] = useState(null)

    const handleImageChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        // Preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setPreviewImage(reader.result)
        }
        reader.readAsDataURL(file)
    }

    const handleSave = async () => {
        if (!previewImage) {
            navigate('/')
            return
        }

        try {
            setUploading(true)
            
            // Convert base64 to file
            const response = await fetch(previewImage)
            const blob = await response.blob()
            const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' })
            
            const formData = new FormData()
            formData.append('profilePic', file)

            const uploadResponse = await axios.post(
                'http://localhost:3000/api/user/setprofilepic', 
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    withCredentials: true
                }
            )

            if (uploadResponse.status === 200) {
                // Update both the profile pic and the full user data in Redux
                dispatch(setProfilePic(uploadResponse.data.user.profilePic))
                dispatch(setUser({
                    ...userdata,
                    profilePic: uploadResponse.data.user.profilePic
                }))
                navigate('/')
            }
        } catch (error) {
            console.error('Error uploading image:', error)
            // You might want to show an error message to the user here
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
            <div className="relative py-3 sm:max-w-xl sm:mx-auto">
                <div className="relative px-4 py-10 bg-white mx-8 md:mx-0 shadow rounded-3xl sm:p-10">
                    <div className="max-w-md mx-auto">
                        <div className="flex items-center space-x-5">
                            <button 
                                onClick={() => navigate(-1)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <BiArrowBack size={24} />
                            </button>
                            <div className="block pl-2 font-semibold text-xl self-start text-gray-700">
                                <h2 className="leading-relaxed">Profile Settings</h2>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-200">
                            <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="relative">
                                        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100">
                                            <img 
                                                src={previewImage || userdata?.profilePic || defaultAvatar} 
                                                alt="Profile" 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <label className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-2 cursor-pointer hover:bg-indigo-700">
                                            <BiUpload size={20} className="text-white" />
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                disabled={uploading}
                                            />
                                        </label>
                                    </div>
                                    {uploading && (
                                        <p className="text-sm text-indigo-600">Uploading...</p>
                                    )}
                                </div>

                                <div className="space-y-4 mt-4">
                                    <div>
                                        <label className="text-gray-500 text-sm">Username</label>
                                        <div className="bg-gray-50 p-3 rounded-lg mt-1">
                                            {userdata?.username || 'Not set'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-gray-500 text-sm">Email</label>
                                        <div className="bg-gray-50 p-3 rounded-lg mt-1">
                                            {userdata?.email || 'Not set'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-gray-500 text-sm">Name</label>
                                        <div className="bg-gray-50 p-3 rounded-lg mt-1">
                                            {userdata?.name || 'Not set'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end space-x-4">
                            <button 
                                onClick={() => navigate('/')}
                                className="px-4 py-2 text-gray-500 hover:text-gray-700"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                disabled={uploading}
                            >
                                {uploading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Profile