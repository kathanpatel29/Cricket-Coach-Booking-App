import { useState } from "react"
import { useNavigate } from "react-router-dom"
import * as api from "../../utils/api"
import { Upload, CheckCircle } from "lucide-react"
import toast from "react-hot-toast"

const CoachOnboardingPage = () => {
  const [step, setStep] = useState(1)
  const [specialization, setSpecialization] = useState("")
  const [experience, setExperience] = useState("")
  const [hourlyRate, setHourlyRate] = useState("")
  const [bio, setBio] = useState("")
  const [profileImage, setProfileImage] = useState(null)
  const navigate = useNavigate()

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    setProfileImage(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const formData = new FormData()
      formData.append("specialization", specialization)
      formData.append("experience", experience)
      formData.append("hourlyRate", hourlyRate)
      formData.append("bio", bio)
      if (profileImage) {
        formData.append("profileImage", profileImage)
      }
      await api.createCoachProfile(formData)
      toast.success("Profile created successfully!")
      navigate("/coach-dashboard")
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create profile")
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Tell us about your expertise</h2>
            <div className="mb-4">
              <label htmlFor="specialization" className="block text-gray-700 text-sm font-bold mb-2">
                Specialization
              </label>
              <select
                id="specialization"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                <option value="">Select specialization</option>
                <option value="Batting">Batting</option>
                <option value="Bowling">Bowling</option>
                <option value="Fielding">Fielding</option>
                <option value="All-rounder">All-rounder</option>
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="experience" className="block text-gray-700 text-sm font-bold mb-2">
                Years of Experience
              </label>
              <input
                type="number"
                id="experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            <button
              onClick={() => setStep(2)}
              className="bg-primary text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline hover:bg-blue-700 transition duration-300"
            >
              Next
            </button>
          </div>
        )
      case 2:
        return (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Set your rate and introduce yourself</h2>
            <div className="mb-4">
              <label htmlFor="hourlyRate" className="block text-gray-700 text-sm font-bold mb-2">
                Hourly Rate ($)
              </label>
              <input
                type="number"
                id="hourlyRate"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="bio" className="block text-gray-700 text-sm font-bold mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows="4"
                required
              ></textarea>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline hover:bg-gray-400 transition duration-300"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="bg-primary text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline hover:bg-blue-700 transition duration-300"
              >
                Next
              </button>
            </div>
          </div>
        )
      case 3:
        return (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Upload your profile picture</h2>
            <div className="mb-4">
              <label htmlFor="profileImage" className="block text-gray-700 text-sm font-bold mb-2">
                Profile Image
              </label>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="profileImage"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 800x400px)</p>
                  </div>
                  <input
                    id="profileImage"
                    type="file"
                    className="hidden"
                    onChange={handleImageUpload}
                    accept="image/*"
                  />
                </label>
              </div>
              {profileImage && (
                <p className="mt-2 text-sm text-gray-500">
                  <CheckCircle className="inline-block w-4 h-4 mr-1 text-green-500" />
                  {profileImage.name} uploaded successfully
                </p>
              )}
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline hover:bg-gray-400 transition duration-300"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="bg-secondary text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline hover:bg-orange-600 transition duration-300"
              >
                Complete Profile
              </button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 font-poppins">Complete Your Coach Profile</h1>
      <div className="max-w-md mx-auto bg-white shadow-md rounded-lg p-6">
        <div className="mb-6">
          <div className="flex items-center">
            <div className={`w-1/3 border-b-2 ${step >= 1 ? "border-primary" : "border-gray-300"}`}></div>
            <div className={`w-1/3 border-b-2 ${step >= 2 ? "border-primary" : "border-gray-300"}`}></div>
            <div className={`w-1/3 border-b-2 ${step >= 3 ? "border-primary" : "border-gray-300"}`}></div>
          </div>
          <div className="flex justify-between text-xs mt-2">
            <span className={step >= 1 ? "text-primary" : "text-gray-500"}>Expertise</span>
            <span className={step >= 2 ? "text-primary" : "text-gray-500"}>Details</span>
            <span className={step >= 3 ? "text-primary" : "text-gray-500"}>Photo</span>
          </div>
        </div>
        {renderStep()}
      </div>
    </div>
  )
}

export default CoachOnboardingPage

